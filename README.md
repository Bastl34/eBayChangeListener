# eBay Change Listener
eBayChangeListener is a node.js eBay "Buy It Now" search result watcher.
You can define a eBay Search URL and get immediately notified by eMail when new items where inserted.


# install
* clone this repository and run
  * `npm install`

# Configure
* copy config.user.js.dist to config.user.js
  * `cp config.user.js.dist config.user.js`
* configure your search:
  * enter a ebay search url:
    * search your product at ebay.com or .de
    * Sorting: newly listed
    * Type: Buy It Now
    * Copy URL and paste it to `searchUrl`
    * you nee do use the advanced search for this
* set your `locale` (ebay.com = "", ebay.de = "de")
* enter `mail` credentials for your smtp mail service (like gmail)
  * if you are using gmail: enable usage for less secure apps in gmail


# start

    node index.js

# start using forever service

    sudo npm install -g forever
    sudo npm install -g forever-service
v
    #add new service
    sudo forever-service install ebayListener --script index.js --noGracefulShutdown --start

    #if you want to uninstall the service
    sudo forever-service delete ebayListener

# Licence
MIT (see License.md)
