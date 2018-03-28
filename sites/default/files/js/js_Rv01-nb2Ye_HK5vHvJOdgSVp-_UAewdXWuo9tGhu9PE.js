jQuery(document).ready( function($) {

  "use strict";

  function ListManager( drupalSettings ) {
  	this.settings = drupalSettings;
  	this.$bibliocommonsResult = $('#bibliocommons-result');
  	this.baseURL = this.settings.base_url;
  	this.list_id = this.settings.list_id;
  	this.appURL  = this.baseURL + '/nypl_bibliocommons/';
  	this.titleInfo = [];
  }

  ListManager.prototype.abstractAjaxCall = function( uri, cb, context ) {
    if ( context ) {
      $.ajax({
        url: uri,
        dataType: "json",
        success: cb,
        context: {
          firstCall : context
        }
      });
    } else {
      $.ajax( {
        url: uri,
        dataType: "json",
        success: cb
      });
    }
  };

  ListManager.prototype.getList = function ( url, cb ) {
    var path = this.appURL + 'lists/' + this.list_id;
    this.abstractAjaxCall(path, cb);
  };

  ListManager.prototype.getTitle = function( url, id, cb, cxt ) {
    var path = this.appURL + 'title/' + id;
    this.abstractAjaxCall(path, cb, cxt);
  };

  ListManager.prototype.formatImageUri = function(type, id, isbnOrUpcs) {
    if (type == 'isbn') {
      return this.appURL + 'image/' + isbnOrUpcs + '/undefined/' + id;
    }
    else {
      return this.appURL + 'image/undefined/' + isbnOrUpcs  + '/' + id;
    }
  };

  ListManager.prototype.formatImageLink = function( type, id, detailsURL, isbnOrUpcs) {
    var catalogUrl = detailsURL.replace( 'any', 'nypl' ), 
        imgSrc;

    if ( type == 'isbn' ) {
      imgSrc = this.formatImageUri('isbn', id, isbnOrUpcs);
    }
    else {
      imgSrc = this.formatImageUri('upcs', id, isbnOrUpcs);
    } 
    return '<a href="'+ catalogUrl +'"><img src="' + imgSrc + '"/></a>';
  };

  ListManager.prototype.formatResults = function(book) {
    var catalogUrl = book.detailsUrl.replace('any', 'nypl'), 
        availabilityClass = 'title-' + book.availability,
        html = '<div class="bibliocommons-row">',
        availability;
    
    if ( book.availability !== 'Available' ) {
      availability = 'Place Hold';
    }
    
    if ( book.imageSrc ) {
      html = html.concat('<div class="bibliocommons-image">' + book.imageSrc + '</div>');
    }
    
    if ( book.title ) {
      html = html.concat('<div class="bibliocommons-title">' + book.title + '</div>');
    }
    
    if ( book.subtitle ) {
      html = html.concat('<div class="bibliocommons-subtitle">' + book.subtitle + '</div>');
    }
    
    if ( book.authorOne ) {
      if ( book.authorOne && book.authorTwo ) {
        html = html.concat('<div class="bibliocommons-author">by ' + book.authorOne + ' and ' + book.authorTwo + ' </div>');
      }
      else {
        html = html.concat('<div class="bibliocommons-author">by ' + book.authorOne + '</div>');
      }
    }
    
    if ( book.availability ) {
      html = html.concat('<div class="bibliocommons-' + availabilityClass + '">');
      html = html.concat('<a href="' + catalogUrl + '">' + book.availability + '</a></div>');
    }
    
    if ( book.description ) {
      html = html.concat('<div class="bibliocommons-description">' + book.description + '</div>');
    }
    
    html = html.concat("</div>");

    return html;
  };
  
  var readingList = new ListManager( Drupal.settings.nypl_bibliocommons );

  readingList.getList(readingList.bibliocommonsURL, function(firstCallData, status) {
    var $resultsDiv = readingList.$bibliocommonsResult,
        uTitles = [], 
        titleMarkup = [],
        subtitle, imageSrc;

    for ( var i in firstCallData.list.list_items ) {
      var r = firstCallData.list.list_items[i];    

      readingList.getTitle(readingList.bibliocommonsURL, r.title.id, function( data, status ) {
        for ( var i in firstCallData.list.list_items ) {
          var record = firstCallData.list.list_items[i].title;
          if (record.title !== undefined && record.id !== undefined ) {
            if ( record.id == data.title.id ) {
              if ($.inArray( record.title, uTitles ) == -1 ) {
                var author1 = record.authors[0] ? record.authors[0].name.split(',') : undefined,
                    authorOneFullName = author1[1] + " " + author1[0],
                    author2 = record.authors[1] ? record.authors[1].name.split(',') : undefined,
                    authorTwoFullName = author2 ? author2[1] + " " + author2[0] : undefined;

                if ( record.hasOwnProperty("sub_title") ) {
                  subtitle = record.sub_title;
                }

                if ( record.hasOwnProperty("isbns") ) {
                  var isbn = record.isbns[0];
                  imageSrc = readingList.formatImageLink("isbn", record.id, record.details_url, isbn); 

                }
                else if ( record.hasOwnProperty("upcs") ) {
                  var upcs = record.upcs[0];
                  imageSrc = readingList.formatImageLink("upcs", record.id, record.details_url, upcs);
                }

                var results = {
                  detailsUrl: record.details_url, 
                  title: record.title, 
                  subtitle: subtitle, 
                  imageSrc: imageSrc, 
                  description: record.description,
                  availability: data.title.availability.name, 
                  authorOne: authorOneFullName,
                  authorTwo: authorTwoFullName
                };

                var html = readingList.formatResults(results);
                uTitles.push(record.title);                
              }
            }
          }
        }
        $('.loading').hide();
        $resultsDiv.append(html);
      }, firstCallData);
    }
  });
});
;
(function ($) {

$(document).ready(function() {

  // Expression to check for absolute internal links.
  var isInternal = new RegExp("^(https?):\/\/" + window.location.host, "i");

  // Attach onclick event to document only and catch clicks on all elements.
  $(document.body).click(function(event) {
    // Catch the closest surrounding link of a clicked element.
    $(event.target).closest("a,area").each(function() {

      var ga = Drupal.settings.googleanalytics;
      // Expression to check for special links like gotwo.module /go/* links.
      var isInternalSpecial = new RegExp("(\/go\/.*)$", "i");
      // Expression to check for download links.
      var isDownload = new RegExp("\\.(" + ga.trackDownloadExtensions + ")$", "i");

      // Is the clicked URL internal?
      if (isInternal.test(this.href)) {
        // Skip 'click' tracking, if custom tracking events are bound.
        if ($(this).is('.colorbox')) {
          // Do nothing here. The custom event will handle all tracking.
        }
        // Is download tracking activated and the file extension configured for download tracking?
        else if (ga.trackDownload && isDownload.test(this.href)) {
          // Download link clicked.
          var extension = isDownload.exec(this.href);
          _gaq.push(["_trackEvent", "Downloads", extension[1].toUpperCase(), this.href.replace(isInternal, '')]);
        }
        else if (isInternalSpecial.test(this.href)) {
          // Keep the internal URL for Google Analytics website overlay intact.
          _gaq.push(["_trackPageview", this.href.replace(isInternal, '')]);
        }
      }
      else {
        if (ga.trackMailto && $(this).is("a[href^='mailto:'],area[href^='mailto:']")) {
          // Mailto link clicked.
          _gaq.push(["_trackEvent", "Mails", "Click", this.href.substring(7)]);
        }
        else if (ga.trackOutbound && this.href.match(/^\w+:\/\//i)) {
          if (ga.trackDomainMode == 2 && isCrossDomain(this.hostname, ga.trackCrossDomains)) {
            // Top-level cross domain clicked. document.location is handled by _link internally.
            event.preventDefault();
            _gaq.push(["_link", this.href]);
          }
          else {
            // External link clicked.
            _gaq.push(["_trackEvent", "Outbound links", "Click", this.href]);
          }
        }
      }
    });
  });

  // Colorbox: This event triggers when the transition has completed and the
  // newly loaded content has been revealed.
  $(document).bind("cbox_complete", function() {
    var href = $.colorbox.element().attr("href");
    if (href) {
      _gaq.push(["_trackPageview", href.replace(isInternal, '')]);
    }
  });

});

/**
 * Check whether the hostname is part of the cross domains or not.
 *
 * @param string hostname
 *   The hostname of the clicked URL.
 * @param array crossDomains
 *   All cross domain hostnames as JS array.
 *
 * @return boolean
 */
function isCrossDomain(hostname, crossDomains) {
  /**
   * jQuery < 1.6.3 bug: $.inArray crushes IE6 and Chrome if second argument is
   * `null` or `undefined`, http://bugs.jquery.com/ticket/10076,
   * https://github.com/jquery/jquery/commit/a839af034db2bd934e4d4fa6758a3fed8de74174
   *
   * @todo: Remove/Refactor in D8
   */
  if (!crossDomains) {
    return false;
  }
  else {
    return $.inArray(hostname, crossDomains) > -1 ? true : false;
  }
}

})(jQuery);
;
