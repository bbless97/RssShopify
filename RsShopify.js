RideStylerShowcase.registerPlugin("Shopify", function (showcaseInstance, pluginProviderInstance, showcaseState, uiLibrary, options){
    let shopifyProducts = [],
    errors = [];
    
    // This will create the "Build Wheel and Tire Package" button in the showcase
    function registerAction(){
        const settings = { isVisible: true, isDisabled: true},
        tireAction = pluginProviderInstance.registerShowcaseAction("global", "Cart", refineProducts, settings);

        showcaseInstance.app.$store.watch(function(state, getters) {
            return getters.userHasProductSelections;
        }, function (hasProduct) {
            tireAction.isDisabled = !hasProduct;
        });
    }

    // Get all shopify products, store them so we can cycle through them and find our products by sku later on
    function getShopifyProducts(){ 
        let requestType = "GET",
        endpoint = "/admin/api/2019-04/products/count.json",
        productCount,
        pageCount;

        if(window.localStorage.getItem('RsProductStore') === null){
            sendRequest(requestType, endpoint).then(function(data){
                productCount = data.count;
                if(productCount > 250){
                    pageCount = Math.ceil(productCount / 250);
                } else {
                    pageCount = 1;   
                }

                for(let i = 1; i <= pageCount; i++){
                    endpoint = "/admin/api/2019-04/products.json?limit=250&page=" + i;
                    sendRequest(requestType, endpoint).then(function(data){
                        data.products.forEach(function(product){
                            shopifyProducts.push(product);
                        });

                        window.localStorage.setItem('RsProductStore', JSON.stringify(shopifyProducts));
                    });
                }
            });
        } else {
            shopifyProducts = JSON.parse(window.localStorage.getItem('RsProductStore'));
        }
    }

    // Refine showcase selected products
    function refineProducts(){
        showcaseInstance.app.$store.dispatch('refineUserSelectedProducts').then(function(userRefinedWheels){
            verifyFitments(userRefinedWheels);
        });
    }

    // Verify fitments in the showcase
    function verifyFitments(products){
        let rideStylerProducts = [],
        successMessage = "Your items have been added to the cart.";

        showcaseInstance.app.$store.dispatch('orderdetails/showModal', {
            data: products
        }).then(function(verifiedProducts){

            for(const product in verifiedProducts){
                rideStylerProducts.push(verifiedProducts[product]);
            }

            Promise.all(rideStylerProducts.map(x => getProductBySku(x))).then(function(products){
                if(errors.length === 0){    
                    products.forEach(function(product){
                        addProductToCart(product);
                    });
                    if(errors.length == 0){
                        uiLibrary.showPrompt(successMessage, goToCart, "Checkout");
                    } else {
                        showErrors();
                    }
                } else {
                    showErrors();
                }
            });
        });
    }

    // Check shopify for our RS showcase selected products.
    function getProductBySku(rsProduct){ 
        let rsProductSku,
        rsProductQuantity = rsProduct.Quantity,
        returnProduct;

        if(rsProduct.type == "wheel"){
            rsProductSku = rsProduct.PartNumber;
        } else {
            rsProductSku = rsProduct.TireFitmentPartNumber;
        }
        
        for(let i = 0; i < shopifyProducts.length; i++){
            for(let j = 0; j < shopifyProducts[i].variants.length; j++){
                if(shopifyProducts[i].variants[j].sku === rsProductSku){
                    returnProduct = shopifyProducts[i].variants[j];
                    returnProduct.quantity = rsProductQuantity;
                    return returnProduct;
                }
            }
        }

        errors.push("Sorry, we could not find your " + rsProduct.type + " in our inventory. \n");
    }

    // Add our products to the shopify cart
    function addProductToCart(product){ 
        let request = new XMLHttpRequest(),
        endpoint = "/cart/add.js",
        formData = new FormData(),
        url;

        if(product !== undefined){
            formData.append("form_type", "product");
            formData.append("id", product.id);
            formData.append("quantity", product.quantity);

            url = "https://" + options.url + endpoint;
            request.open("POST", url, false);
            request.send(formData);
            request.onreadystatechange = function() {
                if(request.readyState === 4 && request.status === 200) {
                    JSON.parse(request.response);
                } else {
                    errors.push("There was an issue adding " + product.name + " to your cart. \n");
                }
            };
        }
    }

    // Template for api requests
    function sendRequest(type, endpoint, formData, sync){ 
        let request = new XMLHttpRequest(),
        url = "https://" + options.url + endpoint;

        request.open(type, url, sync || true);
        request.setRequestHeader('Authorization', "Basic " + window.btoa(options.apiKey + ":" + options.password));
        request.send(formData);

        return new Promise(function(resolve){
            request.onreadystatechange = function() {
                if(request.readyState === 4 && request.status === 200) {
                    resolve(JSON.parse(request.response));
                }
            };
        });
    }

    // Redirect to shopify cart
    function goToCart(){ 
        window.location.href = "/cart";
    }

    // Uses our UiLibrary to display errors
    function showErrors(){
        let errorMessage,
        displayMessage;

        for(let i=0;i<errors.length;i++){
            if(errorMessage !== undefined){
                errorMessage += (errors[i] + "\n");
            } else {
                errorMessage = errors[i];
            }
        };
        
        displayMessage = errorMessage.replace(/\n/g, "<br />");
        uiLibrary.showMessage(displayMessage);
        errors = [];
    }

    registerAction();
    getShopifyProducts();
});
