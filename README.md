# eBay Change Listener
eBayChangeListener is a Node.js eBay "Buy It Now" search result watcher.
You can define a eBay Search URL and get immediately notified by eMail if new items are inserted.


# install
* clone this repository and run
  * `npm install`

# Configure
* copy config.user.js.dist to config.user.js
  * `cp config.user.js.dist config.user.js.dist`
* configure your search:
  * enter a ebay search url:
    * search your product at ebay.com or .de
    * Sorting: newly listed
    * Type: Buy It Now
    * Copy URL and paste it to `searchUrl`
* set your `locale` (ebay.com = "", ebay.de = "de")
* set your `dateFormat` (ebay.com = "MMM-DD HH:mm", ebay.de = "DD. MMM. HH:mm")
* enter `mail` credentials for your smtp mail service (like gmail)


# start

    node index.js

# start using forever service 

    sudo npm install -g forever
    sudo npm install -g forever-service
    
    #add new service
    sudo forever-service install ebayListener --script main.js --noGracefulShutdown --start
    
    #if you want to uninstall the service
    sudo forever-service delete ebayListener

# Licence
MIT (see License.md)