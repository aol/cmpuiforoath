
# cmpuiforoath reference implementation releases

## Version 1.1.0
* Updated npm dependencies
* Fixed bug that resulted in all 24 purpose bits being set even though only 5 are defined.  This should not pose any real concern since consent string parsers should honor the global vendor list (GVL) encoded in the sring.  Since the GVL only defines 5 purposes, only the first 5 bits should be used.  


## Version 1.0.0
* Initial Release