<?php
/**
 * Plugin Name: WP Operations
 * Description: Provides authenticated site context for the WP Operations ChatGPT integration.
 * Version: 0.1.0
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * License: GPL-2.0-or-later
 */
defined( 'ABSPATH' ) || exit;

add_action( 'rest_api_init', function () {
    register_rest_route( 'wp-operations/v1', '/site', array(
        'methods' => WP_REST_Server::READABLE,
        'permission_callback' => function () {
            return current_user_can( 'edit_pages' );
        },
        'callback' => function () {
            $response = new WP_REST_Response( array(
                'protocol_version' => 1,
                'site_name' => get_bloginfo( 'name' ),
                'home_url' => home_url( '/' ),
                'rest_url' => rest_url(),
                'pages_endpoint' => rest_url( 'wp/v2/pages' ),
                'can_publish_pages' => current_user_can( 'publish_pages' ),
            ) );
            $response->header( 'Cache-Control', 'private, no-store' );
            return $response;
        },
    ) );
} );
