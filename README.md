
# Oath Consent Management Platform  UI - Reference Implementation

## What is CMP JS?
Oath’s CMP JS is a client-side JavaScript interface. It is used by ad calls and other client side scripts for accessing information about vendors and their approved consent to allow their data to be gathered, mined, and used.  The CMP JS library is an implementation of the IAB standard for compliance with the European Union’s General Data Protection Regulation (GDPR).

The CMP has 2 main components.  The CMP JS API and the CMP Consent UI.  

The JS API provides an interface to the publisher page for loading, configuring, and initialising the CMP.  The JS API also implements the IAB CMP JS API spec v1.1 for providing user consent information to other scripts on the page (ex. ad tags). 

The CMP Consent UI captures consent from users and provides that consent to the CMP JS API.  

## What is in this project

This project provides a reference implementation for the CMP Consent UI.  Publishers who wish to use the Oath CMP may use this reference implementation for creating their own consent UI.   

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

## How does the CMP Consent UI integrate with Oath's CMP JS API?

When initialising the Oath CMP JS, an "init" command is called and passed a configuration object.  The URL to the consent UI is one of the configuration options.  More information for publisher integration of Oath's CMP JS can be found at <https://docs.google.com/document/d/1SY2rANHbYG4IUkIEjftsWrXVLDg_2DVyVhC5tIig9ck/edit?usp=sharing>    

### Configuring the CMP JS API to use your CMP Consent UI

When initialising Oath's CMP, there are 3 configuration properties relevant to the UI.

1. config.uiUrl [required] {string}
    * URL to publisher's consent UI
2. config.uiDisplayMode [optional] {string}
    * 'iframe' if consent UI should be rendered in a modal iframe
    * 'standalone' if consent UI should be rendered as standalone page
    * defaults to 'iframe'
3. config.uiCustomParams [optional] {object}
    * Used for providing publisher specific data to the consent UI.  This is a generic way to pass values into the CMP Consent UI from the publisher page.  It is not used directly by the CMP JS API.

### initialisation of the CMP Consent UI

The initialisation steps vary depending on whether the UI is rendered as a modal (in an iframe) or as a standalone page.

#### Rendering the CMP Consent UI in a modal iframe

When the CMP requires the user to provide consent, it will load the publisher provided config.uiUrl in an iframe.  It will then post a message to the iframe with the following message format.

~~~~
__cmpUICall: {
    command: 'renderConsentUi',
    parameter: config, // includes config and state information about the CMP
    callId: uniqueId
}
~~~~

The consent UI listens for this message, then initialises and renders the UI.  Once the user has saved their consent, the consent UI posts a message back to the parent window with the following format.

~~~~
__cmpUIReturn: {
    returnValue: consentString, // bsee64 encoded consent string
    success: boolean, // true if successfully captured consent, false if some error occurred.
    callId: uniqueId // same uniqueId passed in the __cmpUICall message
}
~~~~

Once the CMP receives the __cmpUIReturn message, it will store the consent string and destroy the iframe.

#### Rendering the CMP Consent UI in a standalone page

When the CMP requires the user to provide consent, it will redirect to config.uiUrl passing a redirect_url query parameter.  Once the user has saved their consent, the UI redirects back to the redirect_url passing an EuConsent query parameter with the value of the base64 consent string.

**Viewing the consent UI**

The consent UI can be rendered either within an iframe on the publisher page or as a standalone page.  After running the "npm start" command, the UI is available on http:/localhost:8081/cmpui.html.  This URL should be used as the config.uiUrl config property on the publisher page when initialising the CMP.  See the section above on configuring CMP JS for more detail.

By default, the UI will be rendered as an iframe.  To view the UI in a standalone page, set the config.uiDisplayMode config property to "standalone".  

While developing or testing you may want to browse to the consent UI directly.  To do this, browse to <http://localhost:8081/cmpui.html?redirect_url="http://www.whitelisteddomain.com">.  The existence of the redirect_url query parameter is used to determine that the UI is running in standalone mode.  The URL provided must match one of the domains in the publisherConfig.whitelistedRedirectDomains whitelist defined in publisherConfig.js. 

## Configuring the list of vendors

As part of the user experience for collecting consent under GDPR, a user should be able to select the vendors with whom they consent to share their data.  This list of vendors should only include vendors that the publisher may share data with.  Each publisher should provide their own list of vendors with which they share data.  The vendor list information is used by both the publisher’s CMP consent UI and the CMP JS.  By default, the global vendor list is used.  

Both the CMP JS and the CMP UI will look for a file on the site’s root path named pubvendors.json.  This json file should be formatted according to the IAB pubvendors.json spec defined [here](https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework/commit/414b8e23737209f37c018611af299003d167a270?short_path=f38fdf2#diff-f38fdf2ca9690da6bd1bd0bb59e8ae0a).  This json file should include a list of the IAB registered vendor ids.  You can access the IAB global vendor list at <https://service.cmp.oath.com/cmp/v0/vendor_list/global> to locate the ids of the vendors to be included in the pubvendors.json file.  The format of this file is
~~~~
{
  // [Required] Version of the pubvendors.json specification      
  "publisherVendorsVersion": 1, 
  // [Required] Increment on each update of this file
  "version": 1, 
  // [Required] The version of the GVL this was created from
  "globalVendorListVersion": 1, 
  // [Required] Updated for every modification
  "updatedAt": "2018-05-14T00:00:00Z", 
  // [Required] Whitelist vendors
  "vendors": [ 
    {
      // [Required] ID of vendor
      "id": 1 
    },
    {
      "id": 2
    },
    {
      "id": 3
    }
  ]
}

~~~~

**Packaging the UI for distribution**

This project uses webpack for loading source files and packaging them for distribution.  This command generates a "build" directory in the root folder.  The build directory contains all the artifacts needed for the UI to render.  One of the files generated is named cmpui.html.  The URL to this file should be the value of config.uiUrl used to initialise the CMP.  The contents of the build directory should be hosted by the publisher. 
~~~~
npm run build
~~~~

## Overview of the source code

The majority of the business logic is in src/cmpui/cmpui.js.  This is where the UI is initialised, the vendor list data is fetched, and the initial "main" screen is rendered.

The user flow is comprised of 4 screens.  The "main" screen is the initial view the user sees.  The "purposes" screen provides a list of purpose checkboxes for the user to consent to.  The "vendors" screen provides a list of vendor checkboxes for the user to consent to.  And the "confirm" screen is displayed when the user chooses to reject all consent and is prompted to confirm that decision.  Each of these screens are rendered inside a ".cmp-body" container div and swapped out as the user progresses through the flow.

## Modifications to be made by publisher

Publishers may choose to modify almost anything they wish from this reference implementation.  The only requirements for integration with the CMP JS are
1. Implement the interface defined in the CMP implementation guide referenced above.  There is a postMessage interface required for consent UI rendered in an iframe.  And there are certain query parameters that must be read and set when redirecting to and away from this UI when rendered as a standalone page.
2. A properly formatted consent string must be returned to the CMP JS in either the postMessage response (iframe scenario) or in a query parameter (standalone page scenario), formatted according to the IAB spec

Required changes
1. When rendering in a standalone page, the publisherConfig.whitelistedRedirectDomains property must be updated to include a whitelist of valid domains (domains that may trigger this consent UI to render).  This is a security measure to prevent against open redirect attacks.
2. Though not technically required, publishers will likely want to change the "Sample Publisher" label in the UI header (located in cmpui.html).

 

 

