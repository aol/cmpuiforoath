
# Oath Consent Management Platform  UI - Reference Implementation

## What is CMP JS?
Oath’s CMP JS is a client-side JavaScript interface. It is used by ad calls and other client side scripts for accessing information about vendors and their approved consent to allow their data to be gathered, mined, and used.  The CMP JS library is an implementation of the IAB standard for compliance with the European Union’s General Data Protection Regulation (GDPR).

The CMP has 2 main components.  The CMP JS API and the CMP Consent UI.  

The JS API provides an interface to the publisher page for loading, configuring, and initialising the CMP.  The JS API also implements the IAB CMP JS API spec v1.1 for providing user consent information to other scripts on the page (ex. ad tags). 

The CMP Consent UI captures consent from users and provides that consent to the CMP JS API.  

## What is in this project

This project provides a reference implementation for the CMP Consent UI.  Publishers who wish to use the Oath CMP may use this reference implementation for creating their own consent UI.   

## How does the CMP Consent UI integrate with Oath's CMP JS API?

When initializing the Oath CMP JS, an "init" command is called and passed a configuration object.  The URL to the consent UI is one of the configuration options.  More information for publisher integration of Oath's CMP JS can be found at <https://b2b.oath.com/c/cmp-guide-final>    

### Configuring the CMP JS API to use your CMP Consent UI

When initializing Oath's CMP, there are 3 configuration properties relevant to the UI.

1. config.customConsentUI.url {string}
    * URL to publisher's consent UI
2. config.customConsentUI.displayInModal [optional] {boolean}
    * true if consent UI should be rendered in a modal iframe
    * false if consent UI should be rendered as standalone page
    * defaults to true
3. config.customConsentUI.customParams [optional] {object}
    * Used for providing any publisher specific parameters to the consent UI.  This is a generic way to pass values into the CMP Consent UI from the publisher page.  It is not used directly by the CMP JS API.

### Initialization of the CMP Consent UI

The initialization steps vary depending on whether the UI is rendered as a modal (in an iframe) or as a standalone page.

#### Rendering the CMP Consent UI in a modal iframe

When the CMP requires the user to provide consent, it will load the publisher provided config.customConsentUI.url in an iframe.  It will then post a message to the iframe with the following message format.

~~~~
__cmpUICall: {
    command: 'renderConsentUi',
    parameter: customParams, // this is the config.customConsentUI.customParams object passed into the init call.
    callId: uniqueId
}
~~~~

The consent UI should listen for this message, then initialize and render the UI.  Once the user has saved their consent, the consent UI should post a message back to the parent window with the following format.

~~~~
__cmpUIReturn: {
    returnValue: consentString, // bsee64 encoded consent string
    success: boolean, // true if successfully captured consent, false if some error occurred.
    callId: uniqueId // same uniqueId passed in the __cmpUICall message
}
~~~~

Once the CMP receives the __cmpUIReturn message, it will store the consent string and destroy the iframe.

#### Rendering the CMP Consent UI in a standalone page

When the CMP requires the user to provide consent, it will redirect to config.customConsentUI.url with a redirect_url query parameter.  Once the user has saved their consent, the UI should redirect back to the redirect_url passing an EuConsent query parameter with the value of the base64 consent string.

## Setup instructions

Clone the Git repo
~~~~
> git clone https://github.com/aol/cmpuiforoath.git
~~~~

**Install node dependencies**
~~~~
> npm install
~~~~

**Run the code on a local web server**
~~~~
> npm start
~~~~

**Viewing the consent UI**

The consent UI can be rendered either within an iframe on the publisher page or as a standalone page.  

To view the UI in an iframe, set the customConsentUI.url config property when initializing the CMP JS.  See the section above on configuring CMP JS for more detail.

To view the UI in a standalone page, browse to <http://localhost:8081/cmpui.html?redirect_url=http://www.oath.com>.  The existence of the redirect_url query parameter is used to determine that the UI is running in standalone mode.  The URL provided must match one of the domains in the WHITELISTED_REDIRECT_DOMAINS whitelist defined in cmpui.js. 

**Packaging the UI for distribution**

This project uses webpack for loading source files and packaging them into a package for distribution.  This command generates a "build" directory in the root folder. 
~~~~
npm run build
~~~~

## Overview of the source code

The majority of the business logic is in src/cmpui/cmpui.js.  This is where the UI is initialized, the vendor list data is fetched, and the initial "main" screen is rendered.

The user flow is comprised of 4 screens.  The "main" screen is the initial view the user sees.  The "purposes" screen provides a list of purposes checkboxes for the user to consent to.  The "vendors" screen provides a list of vendor checkboxes for the user to consent to.  And the "confirm" screen is displayed when thge user chooses to reject all consent and is prompted to confirm that decision.  Each of screens are rendered inside a ".cmp-body" container div and swapped out as the user progresses through the flow.

## Modifications to be made by publisher

Publishers may choose to modify almost anything they wish from this reference implementation.  The only requirements for integration with the CMP JS are
1. Implement the interface defined in the CMP implementation guide referenced above.  There is a postMessage interface required for consent UI rendered in an iframe.  And there are certain query parameters that must be read and set when redirecting to and away from this UI when rendered as a standalone page.
2. A properly formatted consent string must be returned to the CMP JS in either the postMessage response (iframe scenario) or in a query parameter (standalone page scenario), formatted according to the IAB spec

Required changes
1. In cmpui.js, there is a whitelist of domains (WHITELISTED_REDIRECT_DOMAINS) used to protect against open redirect attacks.  When rendering the consent UI in a standalone page, this whitelist should be replaced with the domain(s) of the sites which host the CMP JS.
2.  In vendorListService.js, there is a URL to the global vendor list API provided by Oath.  This API URL should be changed to point to a vendor list API provided by the publisher.  The specs for this API are defined in the CMP integration document referenced above.  Note: Oath may provide an option to use an API endpoint hosted by Oath, but the process and details for this support are not yet finalized.
 

 

