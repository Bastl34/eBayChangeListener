# eBayChangeListener
eBayChangeListener is a node.js eBay "Buy It Now" search result watcher.
You can define an eBay Search URL and get immediately notified by eMail when new items where inserted.
You can also look for bid based entries.


# Installation
* clone this repository and run
  * `npm install`

# Configure
* copy config.user.js.dist to config.user.js
  * `cp config.user.js.dist config.user.js`
* configure your search:
  * enter a ebay search url:
    * search your product at ebay.com or .de
    * Sorting: newly listed (note the `_sop=10` at the end of the url)
    * Type: Buy It Now
    * Copy URL and paste it to `searchUrl`
    * you neet to use the advanced search for this
* set your `locale` (ebay.com = "", ebay.de = "de")
* enter `mail` credentials for your smtp mail service (like gmail)
  * if you are using gmail: enable usage for less secure apps in gmail

# New/Old eBay webseite version

Note: eBay is showing you sometimes the old design/website.

The old webseite/design is not supported anymore.<br>
If you see urls like this:
```
https://www.ebay.de/sch/Notebooks-Netbooks/175672/i.html?_ftrt=901&_fosrp=1&_sadis=10&_dmd=1&_ipg=50&LH_SALE_CURRENCY=0&_ftrv=1&_from=R40&LH_ItemCondition=3000&_mPrRngCbx=1&_udlo=&_udhi=500&_nkw=%28amd%2C+ryzen%29+%284000%2C+4500u%2C+4700u%29&LH_PrefLoc=1&_sop=10
```

they are not working.

The same search with the new design looks like this:
```
https://www.ebay.de/sch/177/i.html?_from=R40&_nkw=%28amd%2C+ryzen%29+%284000%2C+4500u%2C+4700u%29&LH_TitleDesc=0&LH_PrefLoc=1&LH_ItemCondition=4&_udhi=500&_sop=10
```

# Start

```
npm run dev
```

# Start using forever service

```
  sudo npm install -g forever
  sudo npm install -g forever-service

  #add new service
  sudo forever-service install ebayListener --script index.js --noGracefulShutdown --start

  #if you want to uninstall the service
  sudo forever-service delete ebayListener
```

# Licence
MIT (see License.md)
