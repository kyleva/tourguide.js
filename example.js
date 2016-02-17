(function(){
	// initialize tour
	tourguide.init({
		beforeInit: function(){
			// things to do before intializing onboarding tour
		},
		intro: {
			heading: 'Welcome to the tour!',
			text: 'Welcome to the tour! This is everything you expected! Click "Start tour" to get started!',
			buttons: [
				{
					label: 'Start tour',
					action: tourguide.start
				},
				{
					label: 'Skip tour',
					action: tourguide.end
				}
			]
		}
	});

	// add step(s) to tour
	tourguide.addStep({
		buttons: [
			{
				label: 'Next step',
				action: 'next'
			}
		],
		name: 'navigation',
		element: '#navigation',
		heading: 'Easily navigate to everything you need!',
		text: 'Here is a blurb about the navigation'
	});

	tourguide.addStep({
		buttons: [
			{
				label: 'Prev step',
				action: 'prev'
			},
			{
				label: 'End tour',
				action: 'end'
			}
		],
		name: 'ending',
		element: '#footer',
		heading: 'This is the footer!',
		text: 'We like the footer because it is the end of the tour.'
	});

	// start tour after adding steps
	tourguide.start();
}());