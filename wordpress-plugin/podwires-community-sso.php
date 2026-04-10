<?php
/**
 * Plugin Name: Podwires Community SSO
 * Plugin URI:  https://podwires.com
 * Description: Single sign-on between Podwires.com and community.podwires.com.
 *              Adds /community-login endpoint, rewrites community nav links,
 *              and adds a Community button to the WordPress dashboard.
 * Version:     1.0.0
 * Author:      Podwires
 */

defined('ABSPATH') || exit;

define('PODWIRES_COMMUNITY_URL',     'https://community.podwires.com');
define('PODWIRES_COMMUNITY_SSO_URL', 'https://community.podwires.com/api/auth/sso');
define('PODWIRES_SSO_EXPIRY',        300); // token valid for 5 minutes

// ── 1. Register /community-login rewrite ─────────────────────────────────────

add_action('init', function () {
    add_rewrite_rule('^community-login/?$', 'index.php?community_sso=1', 'top');
    add_rewrite_tag('%community_sso%', '([^&]+)');
});

// Flush rewrite rules on activation only
register_activation_hook(__FILE__, function () {
    add_rewrite_rule('^community-login/?$', 'index.php?community_sso=1', 'top');
    flush_rewrite_rules();
});

register_deactivation_hook(__FILE__, 'flush_rewrite_rules');

// ── 2. Handle /community-login requests ──────────────────────────────────────

add_action('template_redirect', function () {
    if (!get_query_var('community_sso')) return;

    // Not logged in — send to WordPress login, then return here
    if (!is_user_logged_in()) {
        wp_redirect(wp_login_url(home_url('/community-login')));
        exit;
    }

    $user = wp_get_current_user();

    // Determine community role
    $role = podwires_community_role($user);

    // Build JWT payload
    $header  = podwires_b64url(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload = podwires_b64url(json_encode([
        'wp_user_id'     => $user->ID,
        'email'          => $user->user_email,
        'display_name'   => $user->display_name ?: $user->user_login,
        'avatar_url'     => get_avatar_url($user->ID, ['size' => 128, 'default' => 'mp']),
        'community_role' => $role,
        'jti'            => wp_generate_uuid4(),
        'iat'            => time(),
        'exp'            => time() + PODWIRES_SSO_EXPIRY,
        'aud'            => 'https://community.podwires.com',
    ]));

    $secret  = defined('PODWIRES_SSO_SECRET') ? PODWIRES_SSO_SECRET : '';
    $sig     = podwires_b64url(hash_hmac('sha256', "$header.$payload", $secret, true));
    $token   = "$header.$payload.$sig";

    wp_redirect(PODWIRES_COMMUNITY_SSO_URL . '?token=' . rawurlencode($token));
    exit;
});

// ── 3. Map WordPress user role → community role ───────────────────────────────

function podwires_community_role(WP_User $user): string {
    // Admins / editors → community admin
    if (array_intersect(['administrator', 'editor'], (array) $user->roles)) {
        return 'admin';
    }
    // Custom WP role or user-meta override
    $meta = get_user_meta($user->ID, 'community_role', true);
    if (in_array($meta, ['producer', 'client', 'admin'], true)) {
        return $meta;
    }
    // WP roles that map to client
    if (array_intersect(['client', 'customer', 'subscriber'], (array) $user->roles)) {
        return 'client';
    }
    // Default: producer
    return 'producer';
}

// ── 4. Rewrite all Community nav-menu links → community.podwires.com ─────────

add_filter('nav_menu_link_attributes', function (array $atts, WP_Post $item): array {
    $href = $atts['href'] ?? '';
    // Match any internal link that contains "community" but isn't already the subdomain
    if (
        $href &&
        stripos($href, 'community') !== false &&
        stripos($href, 'community.podwires.com') === false
    ) {
        $atts['href'] = PODWIRES_COMMUNITY_URL;
    }
    return $atts;
}, 10, 2);

// Also patch menu item titles that link to community pages
add_filter('the_title', function (string $title, $id = null): string {
    // Only filter nav menu items (post_type = nav_menu_item)
    if ($id && get_post_type($id) === 'nav_menu_item') {
        $url = get_post_meta($id, '_menu_item_url', true);
        if ($url && stripos($url, 'community') !== false && stripos($url, 'community.podwires.com') === false) {
            update_post_meta($id, '_menu_item_url', PODWIRES_COMMUNITY_URL);
        }
    }
    return $title;
}, 10, 2);

// ── 5. Dashboard widget — Community shortcut ──────────────────────────────────

add_action('wp_dashboard_setup', function () {
    wp_add_dashboard_widget(
        'podwires_community_widget',
        'Podwires Community',
        'podwires_community_dashboard_widget'
    );
});

function podwires_community_dashboard_widget(): void {
    $user = wp_get_current_user();
    $role = podwires_community_role($user);
    ?>
    <div style="text-align:center;padding:12px 0">
        <p style="color:#5C5A72;font-size:13px;margin:0 0 14px">
            <?php
            switch ($role) {
                case 'admin':    echo 'Manage the community platform.'; break;
                case 'client':   echo 'Find podcast producers and manage your projects.'; break;
                default:         echo 'Connect with clients and showcase your work.'; break;
            }
            ?>
        </p>
        <a href="<?php echo esc_url(home_url('/community-login')); ?>"
           style="display:inline-flex;align-items:center;gap:8px;padding:10px 22px;
                  background:#4840B0;color:#fff;border-radius:8px;text-decoration:none;
                  font-weight:600;font-size:14px;">
            Go to Community →
        </a>
    </div>
    <?php
}

// ── 6. Add Community link to WP admin bar ────────────────────────────────────

add_action('admin_bar_menu', function (WP_Admin_Bar $bar) {
    if (!is_user_logged_in()) return;
    $bar->add_node([
        'id'    => 'podwires-community',
        'title' => '🎙 Community',
        'href'  => home_url('/community-login'),
        'meta'  => ['title' => 'Go to Podwires Community'],
    ]);
}, 100);

// ── 7. Shortcode [community_button] for use in pages/widgets ─────────────────

add_shortcode('community_button', function (array $atts): string {
    $atts = shortcode_atts(['label' => 'Go to Community'], $atts);
    $url  = esc_url(home_url('/community-login'));
    $label = esc_html($atts['label']);
    return "<a href=\"$url\" style=\"display:inline-flex;align-items:center;gap:8px;
            padding:12px 24px;background:#4840B0;color:#fff;border-radius:10px;
            text-decoration:none;font-weight:600;\">$label →</a>";
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function podwires_b64url(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}
