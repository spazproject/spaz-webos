# What is Spaz webOS? #


Spaz for webOS is a full rewrite of the Spaz codebase. It's based on 
SpazCore, a component library for web runtime applications.

More information: <http://getspaz.com>


## Notes on xAuth ##

Spaz uses [xAuth](http://dev.twitter.com/pages/xauth) to authenticate with Twitter. We do not distribute our consumer key and secret per Twitter's request. You will need to:

  1. [Register an app at Twitter](https://twitter.com/apps/new), and get your own consumer key and secret
  2. Request xAuth access by emailing <api@twitter.com> ([more info](http://dev.twitter.com/pages/xauth))

If you don't want to go through these steps, you'll need to use end-user test builds, and won't be able to run from source.