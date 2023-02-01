$.widget("custom.combobox", {
    _create: function () {
        this.wrapper = $("<span>")
            .addClass("custom-combobox")
            .insertAfter(this.element);

        this.element.hide();
        this._createAutocomplete();
        this._createShowAllButton();
        this._addOptionsToMemory();
    },

    _createAutocomplete: function () {
        var selected = this.element.children(":selected"),
            value = selected.val() ? selected.text() : "";

        this.input = $("<input>")
            .appendTo(this.wrapper)
            .val(value)
            .attr("title", "")
            .attr("id", this.element.attr("id"))
            .addClass("custom-combobox-input ui-widget ui-widget-content ui-state-default ui-corner-left")
            .autocomplete({
                delay: 0,
                minLength: 0,
                source: $.proxy(this, "_source")
            })
            .tooltip({
                classes: {
                    "ui-tooltip": "ui-state-highlight"
                }
            });

        // Make required if original select box was required
        if (this.element.prop('required'))
            this.input.attr('required', 'required');

        if (this.element.prop('disabled'))
            this.input.attr('disabled', 'disabled');

        if (this.element.hasClass('grid-field-select'))
            this.input.addClass('grid-field-text');

        let onFocusOutAttr = this.element.attr('onfocusout');
        if (typeof onFocusOutAttr !== typeof undefined && onFocusOutAttr !== false) {
            this.input.attr('onfocusout', onFocusOutAttr);
        }

        //Add/Remove the active class which drives label size
        var label = $('label[for="' + this.element.attr("id") + '"]');
        if (label.length === 0) {
            var field = this.element.attr("id");
            if (field !== undefined) {
                var fieldSplit = field.split('_');
                label = $('label[for="' + fieldSplit[0] + '"]');
            }
        }

        this.element.removeAttr("id"); //remove id from select tag
        var input = this.input;
        this.input.on('focus', function () {
            if (label !== undefined)
                label.addClass('active');
        })
        this.input.on('blur', function () {
            if (input.val() == '' && label !== undefined)
                label.removeClass('active')
        })
        if (label !== undefined) {
            label.on('click touchend',
                function () {
                    input.focus()
                })
        }

        //Handles validation-failed saving, setting non-blank combo-boxes to active. 
        $(this).ready(function () {
            if (input.val() != '' && input.val() != null) {
                if (label !== undefined)
                    label.addClass('active');
            } else if (label.hasClass('active')) {
                if (label !== undefined)
                    label.removeClass('active');
            }
        });

        this._on(this.input, {
            autocompleteselect: function (event, ui) {
                ui.item.option.selected = true;
                this._trigger("select", event, {
                    item: ui.item.option
                });
            },
            tabOnChange: function (event, opt) {
                opt.selected = true;
                this._trigger("select", event, {
                    item: opt
                });
            },
            autocompletechange: "_removeIfInvalid",
            autocompleteopen: "_removeHover"
        });
    },

    _createShowAllButton: function () {
        var input = this.input,
            wasOpen = false;

        if (!input.prop('disabled')) {
            $("<i>")
                .attr("tabIndex", -1)
                .attr("title", "Show All Items")
                .tooltip()
                .appendTo(this.wrapper)
                .button({
                    icons: {
                        primary: "ui-icon-triangle-1-s"
                    },
                    text: false
                })
                .removeClass("ui-corner-all")
                .addClass("custom-combobox-toggle ui-corner-right")
                .on("mousedown", function () {
                    wasOpen = input.autocomplete("widget").is(":visible");
                })
                .on("click touchend", function () {
                    input.trigger("focus");
                    // Close if already visible
                    if (wasOpen)
                        return;
                    // Pass empty string as value to search for, displaying all results
                    input.autocomplete("search", "");
                });
        }
    },

    _addTabAndReturnListener: function (options) {
        var element = this.element;
        var input = this.input[0];
        this.input.off('keydown.first');          // Disable listener from previous call
        this.input.on('keydown.first', function (e) {
            var keycode = e.which;
            if (keycode == 9 || keycode == 13)             // If tab key pressed
                if (options.length == 1) {
                    var result = null;
                    element.children("option").each(function () {
                        if ($(this).text() == options[0].value)
                            result = this;
                    })
                    if (result != null) {
                        input.value = $(result).text();
                        $(this).trigger("tabOnChange", result);
                    }
                }
        });
    },

    _source: function (request, response) {
        this.input.data("ui-autocomplete").menu.bindings = $();
        var matcher = new RegExp($.ui.autocomplete.escapeRegex(request.term), "i");
        var matchedOptions = []
        this.element._autocompleteOptions.forEach(function (option) {
            if (option.option.value && (!request.term || matcher.test(option.label)) || option.value.toLowerCase() === "create new inventory item" || option.value.toLowerCase() === "search all items") {
                option.option.ontouchend
                matchedOptions.push(option);
            }
        })
        this._addTabAndReturnListener(matchedOptions);
        response(matchedOptions);
    },

    _addOptionsToMemory: function () {
        var autocompleteOptions = [];
        this.element.find('option').each(function () {
            autocompleteOptions.push({
                label: this.text,
                value: this.text,
                option: this
            })
        });
        this.element._autocompleteOptions = autocompleteOptions;
    },

    _removeIfInvalid: function (event, ui) {
        // Selected an item, nothing to do
        if (ui.item)
            return;
        // Search for a match (case-insensitive)
        var value = this.input.val(),
            valueLowerCase = value.toLowerCase(),
            valid = false;
        this.element.children("option").each(function () {
            if ($(this).text().toLowerCase() === valueLowerCase) {
                this.selected = valid = true;
                return false;
            }
        });
        // Found a match, nothing to do
        if (valid)
            return;
        // Remove invalid value
        this.input
            .val("")
            .attr("title", value + " didn't match any item")
            .tooltip("open");
        this.element.val("");
        this._delay(function () {
            this.input.tooltip("close").attr("title", "");
        }, 2500);
        this.input.autocomplete("instance").term = "";
    },

    _destroy: function () {
        this.wrapper.remove();
        this.element.show();
    },

    _removeHover: function (event, ui) {
        $('.ui-autocomplete').off('menufocus hover mouseover mouseenter');
    }
});
