jQuery(document).ready(function() {
	acf.addAction('acfe/fields/button/success/name=get_projects', function(response, $el, data){
		// response
		// $el
		// data

		if ( response.status === 'failed' ) {
			jQuery( '#buddy-get-projects-status' ).html( response.message );
		} else {
            jQuery('[data-name=project] select').empty();
			jQuery.each( response.projects, function(key, value) {
				jQuery('[data-name=project] select')
					.append(jQuery('<option>', { value : key })
					.text(value));
			});

            jQuery( '#buddy-get-projects-status' ).html( 'Successfully loaded projects.' );
            jQuery( '#acf-field_5f710d2b6e06a' ).empty().append(new Option( 'Select Pipeline', 0 ) );

		}
    });
    
    jQuery('#acf-field_5f710cf86e069').on( 'change', function() {
        jQuery( '#acf-field_5f710d2b6e06a' ).empty().append(new Option( 'Select Pipeline', 0 ) );
    });

    acf.addAction('acfe/fields/button/before/name=get_pipelines', function($el, data){
        project = jQuery('#acf-field_5f710cf86e069').val();

        data.project = project;
    });
    
	acf.addAction('acfe/fields/button/success/name=get_pipelines', function(response, $el, data){

		// response
		// $el
		// data

		if ( response.status === 'failed' ) {
			jQuery( '#buddy-get-pipelines-status' ).html( response.message );
		} else {
            jQuery('[data-name=pipeline] select').empty();
			jQuery.each( response.projects, function(key, value) {
				jQuery('[data-name=pipeline] select')
					.append(jQuery('<option>', { value : key })
					.text(value));
			});

			jQuery( '#buddy-get-pipelines-status' ).html( 'Successfully loaded pipelines.' );
		}
	});

	acf.addAction('acfe/fields/button/success/name=run', function(response, $el, data){

		// response
		// $el
		// data

		if ( response.status === 'failed' ) {
			jQuery( '#buddy-run-status' ).html( response.message );
		} else {
			jQuery( '#buddy-run-status' ).html( 'Project running.' );

			function checkStatus(){
				jQuery.ajax({
					type : "GET",
					dataType : "json",
					url : buddy_ajax_object.ajax_url,
					data : { action: 'get_run_status' },
					success: function( response ) {
						jQuery( '#buddy-run-status' ).html( '<div class="spinner is-active"></div> Pipeline is running...' );
						jQuery( '#buddy-run-pipeline' ).prop( 'disabled', true );

						if ( response.execution_status === 'INPROGRESS' || response.execution_status === 'ENQUEUED' || response.execution_status === 'INITIAL' ) {
							setTimeout( checkStatus, 5000 );
						} else {
							jQuery( '#buddy-run-pipeline' ).prop( 'disabled', false );
							jQuery( '#buddy-run-status' ).removeClass( 'spinner' ).html( 'Pipeline finished with status ' + response.execution_status );
						}
					}
				});
			}

			checkStatus();


		}
	});
});
