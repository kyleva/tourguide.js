(function(tourguide){
	/**
	 * Public methods
	 */
	tourguide.addStep = addStep;
	tourguide.end = endTour;
	tourguide.init = initTour;
	tourguide.start = startTour;

	/**
	 * Private vars
	 */
	var steps = [];
	var elements = {};
	var container;
	var containerSelector;

	function initTour(params){
		if ( params.beforeInit !== undefined && typeof params.beforeInit === 'function' ) {
			params.beforeInit();
		}

		Overlay.embed();

		container = (params.container) ? $(params.container) : $('body');
		containerSelector = (params.container) ? params.container : 'body';

		if ( params.intro ) {
			setupIntro(params.intro);
		}

		if ( params.afterInit !== undefined && typeof params.afterInit === 'function' ) {
			params.afterInit();
		}
	}

	function addStep(params){
		var defaults = {};
		var step = {};

		step.name = params.name;
		step.element = params.element;
		step.heading = params.heading;
		step.text = params.text;
		step.buttons = params.buttons;

		steps.push(step);
	}

	function startTour(){
		Overlay.show();

		Popover.setup();
		Step.setup();
		WindowScrolling.disable();

		Step.go( 1 );
	}

	function endTour(event){
		if ( event ) {
			event.preventDefault();
		}

		Overlay.hide();

		Popover.hide(steps[Step.getCurrent()].element);
		WindowScrolling.enable();

		localStorage.setItem('seenTour', '1');
	}

	function setupIntro(params){
		var actions = [];
		var $introWrapper = (function(){
			var introWrapperHtml = '';
			
			introWrapperHtml += '<div class="tourguide-intro-wrap-outer">';
			introWrapperHtml += 	'<div class="tourguide-intro-wrap-inner">';
			introWrapperHtml += 		'<div class="tourguide-intro">';
			introWrapperHtml +=				'<div class="tourguide-intro-heading"></div>';
			introWrapperHtml += 			'<div class="tourguide-intro-content"></div>';
			introWrapperHtml += 			'<div class="tourguide-intro-buttons"></div>';
			introWrapperHtml += 		'</div>';
			introWrapperHtml +=		'</div>';
			introWrapperHtml +=	'</div>';

			return $(introWrapperHtml);
		}()); 
		var buttonHtml = (function(){
			var buttonHtmlString = '';

			$.each(params.buttons, function(i){
				buttonHtmlString += '<a href="javascript:void(0);" class="tourguide-intro-button" data-tourguide-button-id="' + i + '">' + params.buttons[i].label; + '</a>';
			});

			return buttonHtmlString;
		}());
		var $introButtons;

		Overlay.append( $introWrapper );
		$introWrapper.find('.tourguide-intro-heading').append( params.heading );
		$introWrapper.find('.tourguide-intro-content').append( params.text );
		$introWrapper.find('.tourguide-intro-buttons').append( buttonHtml );

		Overlay.show();

		$introButtons = $introWrapper.find('.tourguide-intro-button');
		$introButtons.on('click', function(){
			var button = params.buttons[ $(this).data('tourguide-button-id') ];
			var action = button.action;

			if ( action === undefined ) {
				return;
			}

			if ( action === startTour ) {
				$introWrapper.animate({
					opacity: 0
				}, 600, function(){
					$introWrapper.closest('.tourguide-intro-wrap-outer').remove();
					startTour();
				});
			}
			else if ( typeof action === 'function' ){
				action();
			}
		});
	}

	/**
	 * Scroll handler
	 */
	function scrollToStepElement(element, callback){
		var $popover = $('.popover--tourguide-step');
		var popoverHeight = $popover.outerHeight();
		var scrollTop;
		var timeout = 800;

		scrollTop = gel(element).offset().top + container.scrollTop() - gel('.office365-header').outerHeight();

		if ( container.scrollTop() === (scrollTop - 20) ) {
			timeout = 50;
		}

		container.animate({
			scrollTop: scrollTop - 20
		}, timeout, callback);
	}

	/**
	 * Popover methods
	 */
	var Popover = (function(){
		var $currentPopover = null;

		return {
			getCurrent: getCurrent,
			hide: hide,
			setup: setupPopovers,
			show: show,
		};

		function getCurrent(){
			return $currentPopover;
		}

		function hide(popoverElement){
			gel(popoverElement).popover('hide');
		}

		function show(popoverElement){
			gel(popoverElement).popover('show');
		}

		function setupPopovers(){
			$.each(steps, setupPopoverData);

			initStepPopovers();

			function setupPopoverData(i, v){
				var step = steps[i];
				var $element = gel(step.element);

				$element
					.data('tourguide-step-id', i)
					.addClass('tourguide-step-element');
			}

			function initStepPopovers(){
				var $tourguideStepElements = gel('.tourguide-step-element');
				var popoverConfig = {
					content: function(){
						return getPopoverContent()
					},
					title: function(){
						return getPopoverTitle()
					},
					container: containerSelector,
					placement: function(){
						return getPopoverPlacement()
					},
					trigger: 'manual'
				};

				$tourguideStepElements.each(function(i){
					popoverConfig.template = [
					 '<div class="popover popover--tourguide-step" role="tooltip">',
						'<div class="arrow"></div>',
						'<h3 class="step-popover-title popover-title"></h3>',
						'<div class="step-popover-content popover-content"></div>',
						'<div class="step-popover-buttons">',
							getPopoverButtonHtml(i),
						'</div>',
					 '</div>'
					].join('')

					$(this).popover( popoverConfig );
				});

				function getPopoverPlacement(){
					var placement = 'auto top';
					var windowHeight;
					var scrollTop;
					var elementOffset;
					var distance;
					var $element;

					if ( container.width() >= 768 ) {
						windowHeight = container.height();
						$element = $( steps[Step.getCurrent()].element );
						scrollTop = container.scrollTop();
						elementOffset = $element.offset().top;
						distance = (elementOffset - scrollTop);

						if ( distance < windowHeight/2 && windowHeight > distance + $element.outerHeight() + $('.office365-header').outerHeight() ) {
							placement = 'auto bottom';
						}
					}

					return placement;
				}

				function getPopoverTitle(){
					if ( steps.length ) {
						return steps[Step.getCurrent()].heading;
					}
				}

				function getPopoverContent(){
					if ( steps.length ) {
						return steps[Step.getCurrent()].text;
					}
				}

				function getPopoverButtonHtml(i){
					var buttonsHtml = '';
					var buttons;
					var action;

					if ( steps[i].buttons === undefined ) {
						return '<button class="step-popover-button" data-tourguide-button-continue>Continue</button>';
					}

					buttons = steps[i].buttons;

					for ( var i = 0; i < buttons.length; i++ ) {
						action = getPopoverButtonAction(buttons[i].action);


						buttonsHtml += '<button class="step-popover-button" ' + action + '>' + buttons[i].label + '</button>';
					}

					return buttonsHtml;

					function getPopoverButtonAction(action){
						var actionAttribute = '';

						switch ( action ) {
							case 'end':
								actionAttribute = 'data-tourguide-button-end';
								break;
							case 'next':
								actionAttribute = 'data-tourguide-button-continue';
								break;
							case 'prev':
								actionAttribute = 'data-tourguide-button-prev';
								break;
							case 'start':
								actionAttribute = 'data-tourguide-button-continue';
								break;
						}

						return actionAttribute;
					}
				}
			}
		}
	}());

	/**
	 * Step methods
	 */
	var Step = (function(){
		var currentStep = 0;

		return {
			getCurrent: getCurrentStep,
			go: gotoStep,
			setup: setupSteps
		};

		function getCurrentStep(){
			return currentStep;
		}

		function gotoStep(step){
			var props = steps[step];
			var prevStep = currentStep;
			var stepDifference = step - prevStep;

			Popover.hide(steps[prevStep].element);
			Spotlight.off();

			currentStep = currentStep + stepDifference;

			Popover.hide(step)

			Spotlight.on(props.element);
			scrollToStepElement(props.element, function(){
				Popover.show(props.element);
			});
		}

		function gotoNextStep(event){
			event.preventDefault();

			var nextStep = currentStep + 1;

			if ( nextStep === steps.length ) {
				endTour();
			}
			else {
				Step.go( nextStep );
			}
		}

		function gotoPrevStep(event){
			event.preventDefault();

			var prevStep = currentStep - 1;

			Step.go( prevStep );
		}

		function setupSteps(){
			$(document).on('click', '[data-tourguide-button-continue]', gotoNextStep);
			$(document).on('click', '[data-tourguide-button-end]',      endTour);
			$(document).on('click', '[data-tourguide-button-prev]',     gotoPrevStep);
		}
	}());

	/**
	 * Overlay methods
	 */
	var Overlay = (function(){
		var animationSpeed = 500;
		var $overlayElement;

		return {
			append: appendContent,
			embed: embed,
			hide: hide,
			show: show
		}

		function embed(){
			var $body = gel('body');

			$overlayElement = $('<div class="tourguide-overlay"></div>');

			$body.append( $overlayElement );
			elements['.tourguide-overlay'] = $overlayElement;
		}

		function hide(){
			if ( !$overlayElement.hasClass('tourguide-overlay--visible') ) return;

			$overlayElement.animate({
				opacity: 0
			}, animationSpeed, function(){
				$overlayElement.removeClass('tourguide-overlay--visible');
			});
		}

		function show(){
			if ( $overlayElement.hasClass('tourguide-overlay--visible') ) return;

			$overlayElement.addClass('tourguide-overlay--visible').animate({
				opacity: 1
			}, animationSpeed);
		}

		function appendContent($content){
			$overlayElement.append($content);
		}
	}());

	/**
	 * Spotlight
	 */
	var Spotlight = (function(){
		var $focused;

		return {
			off: off,
			on: on
		}

		function on(element){
			var $element = gel(element);

			$element.addClass('spotlight--on');
			$focused = $element;
		}

		function off(){
			if ( $focused ) {
				$focused.removeClass('spotlight--on');
			}
		}
	}());

	var WindowScrolling = (function(){
		var keys = {37: 1, 38: 1, 39: 1, 40: 1};

		function preventDefault(e) {
			e = e || window.event;
			if (e.preventDefault) {
				e.preventDefault();
				e.returnValue = false;
			}
		}

		function preventDefaultForScrollKeys(e) {
			if (keys[e.keyCode]) {
				preventDefault(e);
				return false;
			}
		}

		function disableScroll() {
			if (window.addEventListener) {
				window.addEventListener('DOMMouseScroll', preventDefault, false);
			}

			window.onwheel = preventDefault; // modern standard
			window.onmousewheel = document.onmousewheel = preventDefault; // older browsers, IE
			window.ontouchmove  = preventDefault; // mobile
			document.onkeydown  = preventDefaultForScrollKeys;
		}

		function enableScroll() {
			if (window.removeEventListener) {
				window.removeEventListener('DOMMouseScroll', preventDefault, false);
			}

			window.onmousewheel = document.onmousewheel = null; 
			window.onwheel = null; 
			window.ontouchmove = null;  
			document.onkeydown = null;  
		}

		return {
			disable: disableScroll,
			enable:  enableScroll
		};
	}());

	/**
	 * Utils
	 */
	function gel(selector){
		var $element;

		if ( elements[selector] !== undefined ) {
			$element = elements[selector];
		}
		else {
			$element = $(selector);
			elements[selector] = $element;
		}

		return $element;
	}

}(window.tourguide = window.tourguide || {}, jQuery));