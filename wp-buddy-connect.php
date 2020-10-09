<?php
/**
 * Plugin Name:     WP Buddy Connect
 * Description:
 * Author:          Maciej Palmowski
 * Text Domain:     buddy-connect
 * Domain Path:     /languages
 * Version:         0.1.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class BuddyConnect {
	private $api_key;
	private $project;
	private $pipeline;
	private $domain;

	function __construct() {
		include 'src/button-field.php';

		$this->api_key  = get_field( 'api_key', 'options' );
		$this->project  = get_field( 'project', 'options' );
		$this->pipeline = get_field( 'pipeline', 'options' );
		$this->domain   = get_field( 'domain', 'options' );

	}

	function init() {
		add_action( 'acf/init', array( $this, 'admin' ) );
		add_filter( 'acf/settings/load_json', array( $this, 'acf_json_load_point' ) );

		add_action( 'wp_ajax_nopriv_get_run_status', array( $this, 'get_run_status' ) );
		add_action( 'wp_ajax_get_run_status', array( $this, 'get_run_status' ) );
		add_action( 'acfe/fields/button/name=get_projects', array( $this, 'buddy_get_projects' ), 10, 2 );
		add_action( 'acfe/fields/button/name=get_pipelines', array( $this, 'buddy_get_pipelines' ), 10, 2 );
		add_action( 'acfe/fields/button/name=run', array( $this, 'buddy_run_pipeline' ), 10, 2 );
		add_filter( 'acf/prepare_field/name=project', array( $this, 'prepare_field' ) );
		add_filter( 'acf/prepare_field/name=pipeline', array( $this, 'prepare_field' ) );
        add_action( 'acf/enqueue_scripts', array( $this, 'buddy_enqueue_admin_script' ) );

	}

	function admin() {
		if ( function_exists( 'acf_add_options_page' ) ) {
			acf_add_options_page(
				array(
					'page_title' => 'Buddy Connect Settings',
					'menu_title' => 'Buddy Connect',
					'menu_slug'  => 'buddy-connect-settings',
					'capability' => 'manage_options',
					'redirect'   => false,
				)
			);
		}
	}

	public function acf_json_load_point( $paths ) {
		// append path
		$paths[] = __DIR__ . '/acf-fields';

		// return
		return $paths;
	}

	public function buddy_get_projects( $field, $post_id ) {
		$this->security_check();

		$response = array(
			'status'  => 'failed',
			'message' => 'Something went wrong',
		);

		$ret = array();

		if ( isset( $_POST['domain'] ) ) {
			$this->domain = $_POST['domain'];
		}

		if ( ! empty( $this->api_key ) ) {
			$buddy = new Buddy\Buddy(
				array(
					'accessToken' => $this->api_key,
				)
			);

			try {
				$resp = $buddy->getApiProjects()->getProjects( $this->domain )->getBody();

				if ( ! empty( $resp['projects'] ) ) {
					$ret[0] = 'Select Project';
					foreach ( $resp['projects'] as $project ) {
						$ret[ $project['name'] ] = $project['display_name'];
					}

					update_field( 'buddy_works_projects_api', $ret, 'options' );

					$response = array(
						'status'   => 'success',
						'projects' => $ret,
					);
				}
			} catch ( Buddy\Exceptions\BuddyResponseException $e ) {
				$response['message'] = $e->getMessage();
			} catch ( Buddy\Exceptions\BuddySDKException $e ) {
				$response['message'] = $e->getMessage();
			}
		}

		wp_send_json( $response );

	}

	public function buddy_get_pipelines( $field, $post_id ) {
		$this->security_check();

		$response = array(
			'status'  => 'failed',
			'message' => 'Something went wrong',
		);

		$ret = array();

		if ( isset( $_POST['domain'] ) ) {
			$this->domain = $_POST['domain'];
		}

		if ( isset( $_POST['project'] ) ) {
			$this->project = $_POST['project'];
		}

		if ( ! empty( $this->api_key ) ) {
			$buddy = new Buddy\Buddy(
				array(
					'accessToken' => $this->api_key,
				)
			);

			try {
				$resp = $buddy->getApiPipelines()->getPipelines( $this->domain, $this->project )->getBody();

				if ( ! empty( $resp['pipelines'] ) ) {
					$ret[0] = 'Select Pipeline';
					foreach ( $resp['pipelines'] as $pipeline ) {
						$ret[ $pipeline['id'] ] = $pipeline['name'];
					}

					update_field( 'buddy_works_pipelines_api', $ret, 'options' );

					$response = array(
						'status'   => 'success',
						'projects' => $ret,
					);
				}
			} catch ( Buddy\Exceptions\BuddyResponseException $e ) {
				$response['message'] = $e->getMessage();
			} catch ( Buddy\Exceptions\BuddySDKException $e ) {
				$response['message'] = $e->getMessage();
			}
		}

		wp_send_json( $response );

	}

	public function prepare_field( $field ) {
		$this->security_check();

		$fields = array(
			'project'  => 'buddy_works_projects_api',
			'pipeline' => 'buddy_works_pipelines_api',
		);

		if ( isset( $fields[ $field['_name'] ] ) ) {
			$field = $this->prepare_field_data( $fields[ $field['_name'] ], $field );
		}

		return $field;
	}

	private function prepare_field_data( $name, $field ) {
		$api_data = get_field( $name, 'options' );

		if ( ! empty( $api_data ) ) {
			$field['choices'] = $api_data;
		}

		return $field;
	}

	public function buddy_run_pipeline( $field, $post_id ) {
		$this->security_check();

		$response = array(
			'status'  => 'failed',
			'message' => 'Something went wrong',
		);

		$ret = array();

		if ( ! empty( $this->api_key ) ) {
			$buddy = new Buddy\Buddy(
				array(
					'accessToken' => $this->api_key,
				)
			);

			$data = array(
				'to_revision' => array(
					'revision' => 'HEAD',
				),
				'comment'     => 'WordPress execution ' . date( 'd.m.Y H:m' ),
				'clear_cache' => false,
			);

			try {
				$resp = $buddy->getApiExecutions()->runExecution( $data, $this->domain, $this->project, $this->pipeline )->getBody();

				update_field( 'buddy_works_execution_id', $resp['id'], 'options' );

				$response = array(
					'status'  => 'success',
					'message' => 'Pipeline started',
				);

			} catch ( Buddy\Exceptions\BuddyResponseException $e ) {
				$response['message'] = $e->getMessage();
			} catch ( Buddy\Exceptions\BuddySDKException $e ) {
				$response['message'] = $e->getMessage();
			}
		}

		wp_send_json( $response );
	}

	public function get_run_status() {
		$this->security_check();

		$response = array(
			'status'  => 'failed',
			'message' => 'Something went wrong',
		);

		$execution = get_field( 'buddy_works_execution_id', 'options' );

		$buddy = new Buddy\Buddy(
			array(
				'accessToken' => $this->api_key,
			)
		);

		try {
			$resp = $buddy->getApiExecutions()->getExecution( $this->domain, $this->project, $this->pipeline, $execution )->getBody();

			$response = array(
				'status'           => 'success',
				'execution_status' => $resp['status'],
			);

		} catch ( Buddy\Exceptions\BuddyResponseException $e ) {
			$response['message'] = $e->getMessage();
		} catch ( Buddy\Exceptions\BuddySDKException $e ) {
			$response['message'] = $e->getMessage();
		}

		wp_send_json( $response );
	}

	public function buddy_enqueue_admin_script( $hook ) {
		wp_enqueue_script( 'buddy_script', plugin_dir_url( __FILE__ ) . 'static/js/buddy-works.js', array(), '1.0' );
		wp_localize_script( 'buddy_script', 'buddy_ajax_object', array( 'ajax_url' => admin_url( 'admin-ajax.php' ) ) );
	}

	public function security_check() {
		if ( ! current_user_can( 'manage_options' ) ) {
			$response = array(
				'status'  => 'failed',
				'message' => 'You\'re are not allowed to do this.',
			);

			wp_send_json( $response );
		}
	}
}

function buddy_connect() {
	$buddy_connect = new BuddyConnect();
	$buddy_connect->init();
}

if ( is_admin() ) {
	buddy_connect();
}
