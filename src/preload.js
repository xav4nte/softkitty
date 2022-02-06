document.onreadystatechange = function () {
    console.log('ready')
    if (document.readyState == "complete") {
      const $ = require('jquery');
      // Do things with $
    }
  }