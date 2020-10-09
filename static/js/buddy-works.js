    (function($){
        if(typeof acf === 'undefined')
            return;
            
        var ACFE_Button = acf.Field.extend({
            
            type: 'acfe_button',
            
            events: {
                'click input': 'onClick',
                'click button': 'onClick',
            },
            $input: function(){
                if(this.$('input').length){
                    return this.$('input');
                }else if(this.$('button').length){
                    return this.$('button');
                }
                
            },
            
            initialize: function(){    
                // vars
                var $button = this.$input();
                
                // inherit data
                this.inherit($button);
                
            },
            
            onClick: function(e, $el){
                
                if(this.get('ajax')){
                    e.preventDefault();
                    
    
                    // serialize form data
                    var data = {
                        action: 'acfe/fields/button',
                        field_name: this.get('name'),
                        field_key: this.get('key')
                    };
                    
                    // Deprecated
                    acf.doAction('acfe/fields/button/before_ajax',                      this.$el, data);
    
                    // Actions
                    acf.doAction('acfe/fields/button/before',                           this.$el, data);
                    acf.doAction('acfe/fields/button/before/key=' + this.get('key'),    this.$el, data);
                    acf.doAction('acfe/fields/button/before/name=' + this.get('name'),  this.$el, data);
                    
                    // ajax
                    $.ajax({
                        url: acf.get('ajaxurl'),
                        data: acf.prepareForAjax(data),
                        type: 'post',
                        dataType: 'json',
                        context: this,
                        
                        // Success
                        success: function(response){
                            
                            // Deprecated
                            acf.doAction('acfe/fields/button/ajax_success',                     response, this.$el, data);
    
                            // Actions
                            acf.doAction('acfe/fields/button/success',                          response, this.$el, data);
                            acf.doAction('acfe/fields/button/success/key=' + this.get('key'),   response, this.$el, data);
                            acf.doAction('acfe/fields/button/success/name=' + this.get('name'), response, this.$el, data);
                            
                        },
                        
                        // Complete
                        complete: function(xhr){
    
                            var response = xhr.responseText;
    
                            // Actions
                            acf.doAction('acfe/fields/button/complete',                             response, this.$el, data);
                            acf.doAction('acfe/fields/button/complete/key=' + this.get('key'),      response, this.$el, data);
                            acf.doAction('acfe/fields/button/complete/name=' + this.get('name'),    response, this.$el, data);
    
                        }
                        
                        
                    });
                    
                }
                
            }
            
        });
    
        acf.registerFieldType(ACFE_Button);
    })(jQuery);

jQuery(document).ready(function() {

    acf.addAction('acfe/fields/button/before/name=get_projects', function($el, data){
        domain  = jQuery('#acf-field_5f7f992aa96b8').val();

        data.domain = domain;
    });

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
        jQuery( '#buddy-get-pipelines' ).click();
    });

    acf.addAction('acfe/fields/button/before/name=get_pipelines', function($el, data){
        project = jQuery('#acf-field_5f710cf86e069').val();
        domain  = jQuery('#acf-field_5f7f992aa96b8').val();

        data.project = project;
        data.domain = domain;
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

    acf.addAction('acfe/fields/button/before/name=run', function(response, $el, data){
        jQuery( '#buddy-run-status' ).html('');
    });

	acf.addAction('acfe/fields/button/success/name=run', function(response, $el, data){

		// response
		// $el
		// data

		if ( response.status === 'failed' ) {
			jQuery( '#buddy-run-status' ).html( response.message );
		} else {
			jQuery( '#buddy-run-status' ).html( '<div class="spinner is-active"></div> Project is running....' );

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