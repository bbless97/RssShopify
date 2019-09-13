(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

RideStylerShowcase.registerPlugin("Shopify", function (showcaseInstance, pluginProviderInstance, showcaseState, uiLibrary, options) {
  var shopifyProducts = [],
      errors = []; // This will create the "Build Wheel and Tire Package" button in the showcase

  function registerAction() {
    var settings = {
      isVisible: true,
      isDisabled: true
    },
        tireAction = pluginProviderInstance.registerShowcaseAction("global", "Cart", refineProducts, settings);
    showcaseInstance.app.$store.watch(function (state, getters) {
      return getters.userHasProductSelections;
    }, function (hasProduct) {
      tireAction.isDisabled = !hasProduct;
    });
  } // Get all shopify products, store them so we can cycle through them and find our products by sku later on


  function getShopifyProducts() {
    return _getShopifyProducts.apply(this, arguments);
  } // Refine showcase selected products


  function _getShopifyProducts() {
    _getShopifyProducts = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee2() {
      var requestType, endpoint, countData, productCount, batchShopProducts, _batchShopProducts;

      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _batchShopProducts = function _ref2() {
                _batchShopProducts = _asyncToGenerator(
                /*#__PURE__*/
                regeneratorRuntime.mark(function _callee() {
                  var shopData;
                  return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                      switch (_context.prev = _context.next) {
                        case 0:
                          _context.next = 2;
                          return sendRequest(requestType, endpoint);

                        case 2:
                          shopData = _context.sent;
                          shopData.products.forEach(function (product) {
                            shopifyProducts.push(product);
                          });

                          if (shopifyProducts.length > 0) {
                            shopifyLastProduct = shopifyProducts[shopifyProducts.length - 1];
                            endpoint = "/admin/api/2019-10/products.json?&limit=250&direction=next&order=title asc&last_id=" + shopifyLastProduct.id + "&last_value=" + shopifyLastProduct.title;
                          }

                          if (shopifyProducts.length !== productCount) {
                            batchShopProducts();
                          } else {
                            window.localStorage.setItem('RsProductStore', JSON.stringify(shopifyProducts));
                          }

                        case 6:
                        case "end":
                          return _context.stop();
                      }
                    }
                  }, _callee);
                }));
                return _batchShopProducts.apply(this, arguments);
              };

              batchShopProducts = function _ref() {
                return _batchShopProducts.apply(this, arguments);
              };

              requestType = "GET";
              endpoint = "/admin/api/2019-10/products/count.json";
              _context2.next = 6;
              return sendRequest(requestType, endpoint);

            case 6:
              countData = _context2.sent;
              productCount = countData.count;
              endpoint = "/admin/api/2019-10/products.json?&limit=250&direction=next&order=title asc"; // Since we cant get all products in one call, I'm batching by shopify's max of 250 until we reach our product count

              if (window.localStorage.getItem('RsProductStore') === null) {
                batchShopProducts();
              } else {
                shopifyProducts = JSON.parse(window.localStorage.getItem('RsProductStore'));
              }

            case 10:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2);
    }));
    return _getShopifyProducts.apply(this, arguments);
  }

  function refineProducts() {
    showcaseInstance.app.$store.dispatch('refineUserSelectedProducts').then(function (userRefinedWheels) {
      verifyFitments(userRefinedWheels);
    });
  } // Verify fitments in the showcase


  function verifyFitments(products) {
    var rideStylerProducts = [],
        successMessage = "Your items have been added to the cart.";
    showcaseInstance.app.$store.dispatch('orderdetails/showModal', {
      data: products
    }).then(function (verifiedProducts) {
      for (var product in verifiedProducts) {
        rideStylerProducts.push(verifiedProducts[product]);
      }

      Promise.all(rideStylerProducts.map(function (x) {
        return getProductBySku(x);
      })).then(function (products) {
        if (errors.length === 0) {
          products.forEach(function (product) {
            addProductToCart(product);
          });

          if (errors.length == 0) {
            uiLibrary.showPrompt(successMessage, goToCart, "Checkout");
          } else {
            showErrors();
          }
        } else {
          showErrors();
        }
      });
    });
  } // Check shopify for our RS showcase selected products.


  function getProductBySku(rsProduct) {
    var rsProductSku,
        rsProductQuantity = rsProduct.Quantity,
        returnProduct;

    if (rsProduct.type == "wheel") {
      rsProductSku = rsProduct.PartNumber;
    } else {
      rsProductSku = rsProduct.TireFitmentPartNumber;
    }

    for (var i = 0; i < shopifyProducts.length; i++) {
      for (var j = 0; j < shopifyProducts[i].variants.length; j++) {
        if (shopifyProducts[i].variants[j].sku === rsProductSku) {
          returnProduct = shopifyProducts[i].variants[j];
          returnProduct.quantity = rsProductQuantity;
          return returnProduct;
        }
      }
    }

    errors.push("Sorry, we could not find your " + rsProduct.type + " in our inventory. \n");
  } // Add our products to the shopify cart


  function addProductToCart(product) {
    var request = new XMLHttpRequest(),
        endpoint = "/cart/add.js",
        formData = new FormData(),
        url;

    if (product !== undefined) {
      formData.append("form_type", "product");
      formData.append("id", product.id);
      formData.append("quantity", product.quantity);
      url = "https://" + options.url + endpoint;
      request.open("POST", url, false);
      request.send(formData);

      request.onreadystatechange = function () {
        if (request.readyState === 4 && request.status === 200) {
          JSON.parse(request.response);
        } else {
          errors.push("There was an issue adding " + product.name + " to your cart. \n");
        }
      };
    }
  } // Template for api requests


  function sendRequest(type, endpoint, formData, sync) {
    var request = new XMLHttpRequest(),
        url = "https://" + options.url + endpoint;
    request.open(type, url, sync || true);
    request.setRequestHeader('Authorization', "Basic " + window.btoa(options.apiKey + ":" + options.password));
    request.send(formData);
    return new Promise(function (resolve) {
      request.onreadystatechange = function () {
        if (request.readyState === 4 && request.status === 200) {
          resolve(JSON.parse(request.response));
        }
      };
    });
  } // Redirect to shopify cart


  function goToCart() {
    window.location.href = "/cart";
  } // Uses our UiLibrary to display errors


  function showErrors() {
    var errorMessage, displayMessage;

    for (var i = 0; i < errors.length; i++) {
      if (errorMessage !== undefined) {
        errorMessage += errors[i];
      } else {
        errorMessage = errors[i];
      }
    }

    ;
    displayMessage = errorMessage.replace(/\n/g, "<br />");
    uiLibrary.showMessage(displayMessage);
    errors = [];
  }

  registerAction();
  getShopifyProducts();
});

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJSc1Nob3BpZnkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7QUNBQSxrQkFBa0IsQ0FBQyxjQUFuQixDQUFrQyxTQUFsQyxFQUE2QyxVQUFVLGdCQUFWLEVBQTRCLHNCQUE1QixFQUFvRCxhQUFwRCxFQUFtRSxTQUFuRSxFQUE4RSxPQUE5RSxFQUFzRjtBQUMvSCxNQUFJLGVBQWUsR0FBRyxFQUF0QjtBQUFBLE1BQ0EsTUFBTSxHQUFHLEVBRFQsQ0FEK0gsQ0FJL0g7O0FBQ0EsV0FBUyxjQUFULEdBQXlCO0FBQ3JCLFFBQU0sUUFBUSxHQUFHO0FBQUUsTUFBQSxTQUFTLEVBQUUsSUFBYjtBQUFtQixNQUFBLFVBQVUsRUFBRTtBQUEvQixLQUFqQjtBQUFBLFFBQ0EsVUFBVSxHQUFHLHNCQUFzQixDQUFDLHNCQUF2QixDQUE4QyxRQUE5QyxFQUF3RCxNQUF4RCxFQUFnRSxjQUFoRSxFQUFnRixRQUFoRixDQURiO0FBR0EsSUFBQSxnQkFBZ0IsQ0FBQyxHQUFqQixDQUFxQixNQUFyQixDQUE0QixLQUE1QixDQUFrQyxVQUFTLEtBQVQsRUFBZ0IsT0FBaEIsRUFBeUI7QUFDdkQsYUFBTyxPQUFPLENBQUMsd0JBQWY7QUFDSCxLQUZELEVBRUcsVUFBVSxVQUFWLEVBQXNCO0FBQ3JCLE1BQUEsVUFBVSxDQUFDLFVBQVgsR0FBd0IsQ0FBQyxVQUF6QjtBQUNILEtBSkQ7QUFLSCxHQWQ4SCxDQWdCL0g7OztBQWhCK0gsV0FpQmhILGtCQWpCZ0g7QUFBQTtBQUFBLElBbUQvSDs7O0FBbkQrSDtBQUFBO0FBQUE7QUFBQSw0QkFpQi9IO0FBQUEsMERBU21CLGlCQVRuQjs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLHdDQVNJO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUNBQzJCLFdBQVcsQ0FBQyxXQUFELEVBQWMsUUFBZCxD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QixFQUE4QjtBQUMxQixRQUFBLFlBQVksSUFBSyxNQUFNLENBQUMsQ0FBRCxDQUF2QjtBQUNILE9BRkQsTUFFTztBQUNILFFBQUEsWUFBWSxHQUFHLE1BQU0sQ0FBQyxDQUFELENBQXJCO0FBQ0g7QUFDSjs7QUFBQTtBQUVELElBQUEsY0FBYyxHQUFHLFlBQVksQ0FBQyxPQUFiLENBQXFCLEtBQXJCLEVBQTRCLFFBQTVCLENBQWpCO0FBQ0EsSUFBQSxTQUFTLENBQUMsV0FBVixDQUFzQixjQUF0QjtBQUNBLElBQUEsTUFBTSxHQUFHLEVBQVQ7QUFDSDs7QUFFRCxFQUFBLGNBQWM7QUFDZCxFQUFBLGtCQUFrQjtBQUNyQixDQXJMRCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIlJpZGVTdHlsZXJTaG93Y2FzZS5yZWdpc3RlclBsdWdpbihcIlNob3BpZnlcIiwgZnVuY3Rpb24gKHNob3djYXNlSW5zdGFuY2UsIHBsdWdpblByb3ZpZGVySW5zdGFuY2UsIHNob3djYXNlU3RhdGUsIHVpTGlicmFyeSwgb3B0aW9ucyl7XHJcbiAgICBsZXQgc2hvcGlmeVByb2R1Y3RzID0gW10sXHJcbiAgICBlcnJvcnMgPSBbXTtcclxuICAgIFxyXG4gICAgLy8gVGhpcyB3aWxsIGNyZWF0ZSB0aGUgXCJCdWlsZCBXaGVlbCBhbmQgVGlyZSBQYWNrYWdlXCIgYnV0dG9uIGluIHRoZSBzaG93Y2FzZVxyXG4gICAgZnVuY3Rpb24gcmVnaXN0ZXJBY3Rpb24oKXtcclxuICAgICAgICBjb25zdCBzZXR0aW5ncyA9IHsgaXNWaXNpYmxlOiB0cnVlLCBpc0Rpc2FibGVkOiB0cnVlfSxcclxuICAgICAgICB0aXJlQWN0aW9uID0gcGx1Z2luUHJvdmlkZXJJbnN0YW5jZS5yZWdpc3RlclNob3djYXNlQWN0aW9uKFwiZ2xvYmFsXCIsIFwiQ2FydFwiLCByZWZpbmVQcm9kdWN0cywgc2V0dGluZ3MpO1xyXG5cclxuICAgICAgICBzaG93Y2FzZUluc3RhbmNlLmFwcC4kc3RvcmUud2F0Y2goZnVuY3Rpb24oc3RhdGUsIGdldHRlcnMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGdldHRlcnMudXNlckhhc1Byb2R1Y3RTZWxlY3Rpb25zO1xyXG4gICAgICAgIH0sIGZ1bmN0aW9uIChoYXNQcm9kdWN0KSB7XHJcbiAgICAgICAgICAgIHRpcmVBY3Rpb24uaXNEaXNhYmxlZCA9ICFoYXNQcm9kdWN0O1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEdldCBhbGwgc2hvcGlmeSBwcm9kdWN0cywgc3RvcmUgdGhlbSBzbyB3ZSBjYW4gY3ljbGUgdGhyb3VnaCB0aGVtIGFuZCBmaW5kIG91ciBwcm9kdWN0cyBieSBza3UgbGF0ZXIgb25cclxuICAgIGFzeW5jIGZ1bmN0aW9uIGdldFNob3BpZnlQcm9kdWN0cygpe1xyXG4gICAgICAgIGxldCByZXF1ZXN0VHlwZSA9IFwiR0VUXCIsXHJcbiAgICAgICAgZW5kcG9pbnQgPSBcIi9hZG1pbi9hcGkvMjAxOS0xMC9wcm9kdWN0cy9jb3VudC5qc29uXCIsXHJcbiAgICAgICAgY291bnREYXRhID0gYXdhaXQgc2VuZFJlcXVlc3QocmVxdWVzdFR5cGUsIGVuZHBvaW50KSxcclxuICAgICAgICBwcm9kdWN0Q291bnQgPSBjb3VudERhdGEuY291bnQ7XHJcblxyXG4gICAgICAgIGVuZHBvaW50ID0gXCIvYWRtaW4vYXBpLzIwMTktMTAvcHJvZHVjdHMuanNvbj8mbGltaXQ9MjUwJmRpcmVjdGlvbj1uZXh0Jm9yZGVyPXRpdGxlIGFzY1wiO1xyXG5cclxuICAgICAgICAvLyBTaW5jZSB3ZSBjYW50IGdldCBhbGwgcHJvZHVjdHMgaW4gb25lIGNhbGwsIEknbSBiYXRjaGluZyBieSBzaG9waWZ5J3MgbWF4IG9mIDI1MCB1bnRpbCB3ZSByZWFjaCBvdXIgcHJvZHVjdCBjb3VudFxyXG4gICAgICAgIGFzeW5jIGZ1bmN0aW9uIGJhdGNoU2hvcFByb2R1Y3RzKCl7XHJcbiAgICAgICAgICAgIGNvbnN0IHNob3BEYXRhID0gYXdhaXQgc2VuZFJlcXVlc3QocmVxdWVzdFR5cGUsIGVuZHBvaW50KTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHNob3BEYXRhLnByb2R1Y3RzLmZvckVhY2goZnVuY3Rpb24ocHJvZHVjdCl7XHJcbiAgICAgICAgICAgICAgICBzaG9waWZ5UHJvZHVjdHMucHVzaChwcm9kdWN0KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZihzaG9waWZ5UHJvZHVjdHMubGVuZ3RoID4gMCl7XHJcbiAgICAgICAgICAgICAgICBzaG9waWZ5TGFzdFByb2R1Y3QgPSBzaG9waWZ5UHJvZHVjdHNbc2hvcGlmeVByb2R1Y3RzLmxlbmd0aCAtIDFdO1xyXG4gICAgICAgICAgICAgICAgZW5kcG9pbnQgPSBcIi9hZG1pbi9hcGkvMjAxOS0xMC9wcm9kdWN0cy5qc29uPyZsaW1pdD0yNTAmZGlyZWN0aW9uPW5leHQmb3JkZXI9dGl0bGUgYXNjJmxhc3RfaWQ9XCIgKyBzaG9waWZ5TGFzdFByb2R1Y3QuaWQgKyBcIiZsYXN0X3ZhbHVlPVwiICsgc2hvcGlmeUxhc3RQcm9kdWN0LnRpdGxlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmKHNob3BpZnlQcm9kdWN0cy5sZW5ndGggIT09IHByb2R1Y3RDb3VudCl7XHJcbiAgICAgICAgICAgICAgICBiYXRjaFNob3BQcm9kdWN0cygpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKCdSc1Byb2R1Y3RTdG9yZScsIEpTT04uc3RyaW5naWZ5KHNob3BpZnlQcm9kdWN0cykpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZih3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oJ1JzUHJvZHVjdFN0b3JlJykgPT09IG51bGwpe1xyXG4gICAgICAgICAgICBiYXRjaFNob3BQcm9kdWN0cygpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHNob3BpZnlQcm9kdWN0cyA9IEpTT04ucGFyc2Uod2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKCdSc1Byb2R1Y3RTdG9yZScpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUmVmaW5lIHNob3djYXNlIHNlbGVjdGVkIHByb2R1Y3RzXHJcbiAgICBmdW5jdGlvbiByZWZpbmVQcm9kdWN0cygpe1xyXG4gICAgICAgIHNob3djYXNlSW5zdGFuY2UuYXBwLiRzdG9yZS5kaXNwYXRjaCgncmVmaW5lVXNlclNlbGVjdGVkUHJvZHVjdHMnKS50aGVuKGZ1bmN0aW9uKHVzZXJSZWZpbmVkV2hlZWxzKXtcclxuICAgICAgICAgICAgdmVyaWZ5Rml0bWVudHModXNlclJlZmluZWRXaGVlbHMpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFZlcmlmeSBmaXRtZW50cyBpbiB0aGUgc2hvd2Nhc2VcclxuICAgIGZ1bmN0aW9uIHZlcmlmeUZpdG1lbnRzKHByb2R1Y3RzKXtcclxuICAgICAgICBsZXQgcmlkZVN0eWxlclByb2R1Y3RzID0gW10sXHJcbiAgICAgICAgc3VjY2Vzc01lc3NhZ2UgPSBcIllvdXIgaXRlbXMgaGF2ZSBiZWVuIGFkZGVkIHRvIHRoZSBjYXJ0LlwiO1xyXG5cclxuICAgICAgICBzaG93Y2FzZUluc3RhbmNlLmFwcC4kc3RvcmUuZGlzcGF0Y2goJ29yZGVyZGV0YWlscy9zaG93TW9kYWwnLCB7XHJcbiAgICAgICAgICAgIGRhdGE6IHByb2R1Y3RzXHJcbiAgICAgICAgfSkudGhlbihmdW5jdGlvbih2ZXJpZmllZFByb2R1Y3RzKXtcclxuXHJcbiAgICAgICAgICAgIGZvcihjb25zdCBwcm9kdWN0IGluIHZlcmlmaWVkUHJvZHVjdHMpe1xyXG4gICAgICAgICAgICAgICAgcmlkZVN0eWxlclByb2R1Y3RzLnB1c2godmVyaWZpZWRQcm9kdWN0c1twcm9kdWN0XSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIFByb21pc2UuYWxsKHJpZGVTdHlsZXJQcm9kdWN0cy5tYXAoeCA9PiBnZXRQcm9kdWN0QnlTa3UoeCkpKS50aGVuKGZ1bmN0aW9uKHByb2R1Y3RzKXtcclxuICAgICAgICAgICAgICAgIGlmKGVycm9ycy5sZW5ndGggPT09IDApeyAgICBcclxuICAgICAgICAgICAgICAgICAgICBwcm9kdWN0cy5mb3JFYWNoKGZ1bmN0aW9uKHByb2R1Y3Qpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhZGRQcm9kdWN0VG9DYXJ0KHByb2R1Y3QpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKGVycm9ycy5sZW5ndGggPT0gMCl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHVpTGlicmFyeS5zaG93UHJvbXB0KHN1Y2Nlc3NNZXNzYWdlLCBnb1RvQ2FydCwgXCJDaGVja291dFwiKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzaG93RXJyb3JzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBzaG93RXJyb3JzKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIENoZWNrIHNob3BpZnkgZm9yIG91ciBSUyBzaG93Y2FzZSBzZWxlY3RlZCBwcm9kdWN0cy5cclxuICAgIGZ1bmN0aW9uIGdldFByb2R1Y3RCeVNrdShyc1Byb2R1Y3Qpe1xyXG4gICAgICAgIGxldCByc1Byb2R1Y3RTa3UsXHJcbiAgICAgICAgcnNQcm9kdWN0UXVhbnRpdHkgPSByc1Byb2R1Y3QuUXVhbnRpdHksXHJcbiAgICAgICAgcmV0dXJuUHJvZHVjdDtcclxuXHJcbiAgICAgICAgaWYocnNQcm9kdWN0LnR5cGUgPT0gXCJ3aGVlbFwiKXtcclxuICAgICAgICAgICAgcnNQcm9kdWN0U2t1ID0gcnNQcm9kdWN0LlBhcnROdW1iZXI7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcnNQcm9kdWN0U2t1ID0gcnNQcm9kdWN0LlRpcmVGaXRtZW50UGFydE51bWJlcjtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IHNob3BpZnlQcm9kdWN0cy5sZW5ndGg7IGkrKyl7XHJcbiAgICAgICAgICAgIGZvcihsZXQgaiA9IDA7IGogPCBzaG9waWZ5UHJvZHVjdHNbaV0udmFyaWFudHMubGVuZ3RoOyBqKyspe1xyXG4gICAgICAgICAgICAgICAgaWYoc2hvcGlmeVByb2R1Y3RzW2ldLnZhcmlhbnRzW2pdLnNrdSA9PT0gcnNQcm9kdWN0U2t1KXtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm5Qcm9kdWN0ID0gc2hvcGlmeVByb2R1Y3RzW2ldLnZhcmlhbnRzW2pdO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblByb2R1Y3QucXVhbnRpdHkgPSByc1Byb2R1Y3RRdWFudGl0eTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmV0dXJuUHJvZHVjdDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZXJyb3JzLnB1c2goXCJTb3JyeSwgd2UgY291bGQgbm90IGZpbmQgeW91ciBcIiArIHJzUHJvZHVjdC50eXBlICsgXCIgaW4gb3VyIGludmVudG9yeS4gXFxuXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEFkZCBvdXIgcHJvZHVjdHMgdG8gdGhlIHNob3BpZnkgY2FydFxyXG4gICAgZnVuY3Rpb24gYWRkUHJvZHVjdFRvQ2FydChwcm9kdWN0KXtcclxuICAgICAgICBsZXQgcmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpLFxyXG4gICAgICAgIGVuZHBvaW50ID0gXCIvY2FydC9hZGQuanNcIixcclxuICAgICAgICBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgpLFxyXG4gICAgICAgIHVybDtcclxuXHJcbiAgICAgICAgaWYocHJvZHVjdCAhPT0gdW5kZWZpbmVkKXtcclxuICAgICAgICAgICAgZm9ybURhdGEuYXBwZW5kKFwiZm9ybV90eXBlXCIsIFwicHJvZHVjdFwiKTtcclxuICAgICAgICAgICAgZm9ybURhdGEuYXBwZW5kKFwiaWRcIiwgcHJvZHVjdC5pZCk7XHJcbiAgICAgICAgICAgIGZvcm1EYXRhLmFwcGVuZChcInF1YW50aXR5XCIsIHByb2R1Y3QucXVhbnRpdHkpO1xyXG5cclxuICAgICAgICAgICAgdXJsID0gXCJodHRwczovL1wiICsgb3B0aW9ucy51cmwgKyBlbmRwb2ludDtcclxuICAgICAgICAgICAgcmVxdWVzdC5vcGVuKFwiUE9TVFwiLCB1cmwsIGZhbHNlKTtcclxuICAgICAgICAgICAgcmVxdWVzdC5zZW5kKGZvcm1EYXRhKTtcclxuICAgICAgICAgICAgcmVxdWVzdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIGlmKHJlcXVlc3QucmVhZHlTdGF0ZSA9PT0gNCAmJiByZXF1ZXN0LnN0YXR1cyA9PT0gMjAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgSlNPTi5wYXJzZShyZXF1ZXN0LnJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLnB1c2goXCJUaGVyZSB3YXMgYW4gaXNzdWUgYWRkaW5nIFwiICsgcHJvZHVjdC5uYW1lICsgXCIgdG8geW91ciBjYXJ0LiBcXG5cIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIFRlbXBsYXRlIGZvciBhcGkgcmVxdWVzdHNcclxuICAgIGZ1bmN0aW9uIHNlbmRSZXF1ZXN0KHR5cGUsIGVuZHBvaW50LCBmb3JtRGF0YSwgc3luYyl7XHJcbiAgICAgICAgbGV0IHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKSxcclxuICAgICAgICB1cmwgPSBcImh0dHBzOi8vXCIgKyBvcHRpb25zLnVybCArIGVuZHBvaW50O1xyXG5cclxuICAgICAgICByZXF1ZXN0Lm9wZW4odHlwZSwgdXJsLCBzeW5jIHx8IHRydWUpO1xyXG4gICAgICAgIHJlcXVlc3Quc2V0UmVxdWVzdEhlYWRlcignQXV0aG9yaXphdGlvbicsIFwiQmFzaWMgXCIgKyB3aW5kb3cuYnRvYShvcHRpb25zLmFwaUtleSArIFwiOlwiICsgb3B0aW9ucy5wYXNzd29yZCkpO1xyXG4gICAgICAgIHJlcXVlc3Quc2VuZChmb3JtRGF0YSk7XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlKXtcclxuICAgICAgICAgICAgcmVxdWVzdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIGlmKHJlcXVlc3QucmVhZHlTdGF0ZSA9PT0gNCAmJiByZXF1ZXN0LnN0YXR1cyA9PT0gMjAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShKU09OLnBhcnNlKHJlcXVlc3QucmVzcG9uc2UpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBSZWRpcmVjdCB0byBzaG9waWZ5IGNhcnRcclxuICAgIGZ1bmN0aW9uIGdvVG9DYXJ0KCl7XHJcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSBcIi9jYXJ0XCI7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gVXNlcyBvdXIgVWlMaWJyYXJ5IHRvIGRpc3BsYXkgZXJyb3JzXHJcbiAgICBmdW5jdGlvbiBzaG93RXJyb3JzKCl7XHJcbiAgICAgICAgbGV0IGVycm9yTWVzc2FnZSxcclxuICAgICAgICBkaXNwbGF5TWVzc2FnZTtcclxuXHJcbiAgICAgICAgZm9yKGxldCBpPTA7aTxlcnJvcnMubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgIGlmKGVycm9yTWVzc2FnZSAhPT0gdW5kZWZpbmVkKXtcclxuICAgICAgICAgICAgICAgIGVycm9yTWVzc2FnZSArPSAoZXJyb3JzW2ldKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGVycm9yTWVzc2FnZSA9IGVycm9yc1tpXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgZGlzcGxheU1lc3NhZ2UgPSBlcnJvck1lc3NhZ2UucmVwbGFjZSgvXFxuL2csIFwiPGJyIC8+XCIpO1xyXG4gICAgICAgIHVpTGlicmFyeS5zaG93TWVzc2FnZShkaXNwbGF5TWVzc2FnZSk7XHJcbiAgICAgICAgZXJyb3JzID0gW107XHJcbiAgICB9XHJcblxyXG4gICAgcmVnaXN0ZXJBY3Rpb24oKTtcclxuICAgIGdldFNob3BpZnlQcm9kdWN0cygpO1xyXG59KTtcclxuIl19
