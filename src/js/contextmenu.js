/* ========================================================================
 * ZUI: contextmenu.js
 * http://zui.sexy
 * ========================================================================
 * Copyright (c) 2017-2018 cnezsoft.com; Licensed MIT
 * ======================================================================== */


(function($, undefined) {
    'use strict';

    var NAME = 'zui.contextmenu'; // model name

    var DEFAULTS = {
        // onShow: null,
        // onShown: null,
        // onHide: null,
        // onHidden: null,
        // itemCreator: null,
        // x: 0,
        // y: 0,
        // onClickItem: null,
        duration: 400,
    };

    var ContextMenu = {};
    var targetId = 'zui-contextmenu-' + $.zui.uuid();
    var mouseX = 0, mouseY = 0;
    var listenMouseMove = function() {
        $(document).off('mousemove.' + NAME).on('mousemove.' + NAME, function(e) {
            mouseX = e.pageX;
            mouseY = e.pageY;
        });
        return ContextMenu;
    };
    var createMenuItem = function(item, index) {
        if (typeof item === 'string') {
            if (item === 'seperator' || item === 'divider' || item === '-' || item === '|') {
                item = {type: 'seperator'};
            } else {
                item = {label: item, id: index};
            }
        }
        if (item.type === 'seperator' || item.type === 'divider') {
            return $('<li class="divider"></li>');
        }
        var $a = $('<a/>').attr({
            href: item.url,
            'class': item.className,
            style: item.style
        }).toggleClass('disabled', item.disabled === true).data('item', item);
        if (item.html) {
            $a.html(item.html);
        } else {
            $a.text(item.label || item.text);
        }
        if (item.onClick) {
            $a.on('click', item.onClick);
        }
        return $('<li />').append($a);
    };

    var animationTimer = null;
    var hideContextMenu = function(id, callback) {
        if (animationTimer) {
            clearTimeout(animationTimer);
            animationTimer = null;
        }

        var $target = $('#' + targetId);
        if ($target.length) {
            var options = $target.data('options');
            if (!id || options.id === id) {
                var afterHide = function() {
                    $target.hide();
                    options.onHidden && options.onHidden();
                    callback && callback();
                };
                options.onHide && options.onHide();
                var animation = options.animation;
                $target.removeClass('in');
                if (animation) {
                    animationTimer = setTimeout(afterHide, options.duration);
                } else {
                    afterHide();
                }
            }
        }
        return ContextMenu;
    };

    var showContextMenu = function(items, options, callback) {
        if (typeof items === 'object') {
            callback = options;
            options = items;
            items = options.items;
        }

        hideContextMenu();

        options = $.extend({}, DEFAULTS, options);
        var x = options.x;
        var y = options.y;
        if (x === undefined) x = options.pageX;
        if (x === undefined) x = mouseX;
        if (y === undefined) y = options.pageY;
        if (y === undefined) y = mouseY;

        var $target = $('#' + targetId);
        if (!$target.length) {
            $target = $('<div style="display: none; position: fixed; z-index: 2000;" class="contextmenu" id="' + targetId + '"><ul class="dropdown-menu contextmenu-menu"></ul></div>').appendTo('body');
        }
        var $menu = $target.find('.contextmenu-menu').off('click.' + NAME).on('click.' + NAME, 'a', function(e) {
            var $item = $(this);
            var clickResult = options.onClickItem && options.onClickItem($item.data('item'), $item, e);
            if (clickResult !== false) {
                hideContextMenu();
            }
        }).empty();;
        $target.hide().attr('class', 'contextmenu');
        var itemCreator = options.itemCreator || createMenuItem;
        var itemsType = typeof items;
        if (itemsType === 'string') {
            items = items.split(',');
        } else if (itemsType === 'function') {
            items = items(options);
        }
        $.each(items, function(index, item) {
            $menu.append(itemCreator(item, index));
        });

        // Show menu
        var animation = options.animation;
        var duration = options.duration;
        if (animation === true) options.animation = animation = 'fade';
        if (animationTimer) {
            clearTimeout(animationTimer);
            animationTimer = null;
        }
        var afterShow = function() {
            $target.addClass('in');
            options.onShown && options.onShown();
            callback && callback();
        };
        options.onShow && options.onShow();
        $target.show().addClass('open').data('options', {
            animation: animation,
            onHide: options.onHide,
            onHidden: options.onHidden,
            id: options.id,
            duration: duration
        });

        var $w = $(window);
        x = Math.max(0, Math.min(x, $w.width() - $menu.outerWidth()));
        y = Math.max(0, Math.min(y, $w.height() - $menu.outerHeight()));
        $target.css({
            left: x,
            top: y
        });

        if (animation) {
            $target.addClass(animation);
            animationTimer = setTimeout(afterShow, options.duration);
        } else {
            afterShow();
        }
        return ContextMenu;
    };

    $(document).on('click', function(e) {
        if (!$(e.target).closest('.contextmenu').length) {
            hideContextMenu();
        }
    });

    $.extend(ContextMenu, {
        NAME: NAME,
        DEFAULTS: DEFAULTS,
        show: showContextMenu,
        hide: hideContextMenu,
        listenMouse: listenMouseMove
    });
    $.zui({ContextMenu: ContextMenu});


    // The contextmenu model class
    var ContextListener = function(element, options) {
        var that = this;
        that.name = NAME;
        that.$ = $(element);

        options = that.options = $.extend({trigger: 'contextmenu'}, ContextMenu.DEFAULTS, this.$.data(), options);

        var trigger = options.trigger;
        var isIE = $.zui.browser && $.zui.browser.ie && $.zui.browser.ie < 11;
        if (isIE && trigger === 'contextmenu') trigger = 'mousedown';

        that.id = $.zui.uuid();
        var eventHandler = function(e) {
            if (isIE && e.button !== 2) {
                return;
            }
            var config = {
                x: e.clientX,
                y: e.clientY,
                event: e
            };
            if (options.itemsCreator) {
                config.items = options.itemsCreator.call(this, e);
            }
            that.show(config);
            e.preventDefault();
            return false;
        };
        var eventName = trigger + '.' + NAME;
        if (options.selector) {
            that.$.on(eventName, options.selector, eventHandler);
        } else {
            that.$.on(eventName, eventHandler);
        }
    };

    ContextListener.prototype.destory = function () {
        that.$.off('.' + NAME);
    };

    ContextListener.prototype.hide = function (callback) {
        ContextMenu.hide(this.id, callback);
    };

    ContextListener.prototype.show = function (options, callback) {
        options = $.extend({}, this.options, options);
        ContextMenu.show(options, callback);
    };

    // Extense jquery element
    $.fn.contextmenu = function(option) {
        return this.each(function() {
            var $this = $(this);
            var data = $this.data(NAME);
            var options = typeof option == 'object' && option;

            if(!data) $this.data(NAME, (data = new ContextListener(this, options)));

            if(typeof option == 'string') data[option]();
        });
    };
    $.fn.contextmenu.Constructor = ContextListener;
}(jQuery, undefined));

