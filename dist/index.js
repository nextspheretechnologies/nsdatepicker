'use strict';
(function(angular){
  'use strict';

  var Module = angular.module('datePicker', []);

  Module.constant('datePickerConfig', {
    template: 'templates/datepicker.html',
    view: 'month',
    views: ['year', 'month', 'date', 'hours', 'minutes'],
    step: 5,
    min: new Date(1900,0,1),
    max: new Date(2200,0,1),
    pickerMode:'datepickermode'
  });

  function getVisibleMinutes(date, step) {
    date = new Date(date || new Date());
    date = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours());
    var minutes = [];
    var stop = date.getTime() + 60 * 60 * 1000;
    while (date.getTime() < stop) {
      minutes.push(date);
      date = new Date(date.getTime() + step * 60 * 1000);
    }
    return minutes;
  }

  function getVisibleWeeks(date) {
    date = new Date(date || new Date());
    date.setDate(1);
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);

    if (date.getDay() === 0) {
      date.setDate(-5);
    } else {
      date.setDate(date.getDate() - (date.getDay() - 1));
    }
    if (date.getDate() === 1) {
      date.setDate(-6);
    }

    var weeks = [];
    while (weeks.length < 6) {
      var week = [];
      for (var i = 0; i < 7; i++) {

        week.push({day:new Date(date),isDate:true});
        date.setDate(date.getDate() + 1);
      }
      // week.push({day:"10",isDate:false});
      weeks.push(week);
    }
    return weeks;
  }

  function getVisibleYears(date) {
    var years = [];
    date = new Date(date || new Date());
    date.setFullYear(date.getFullYear() - (date.getFullYear() % 10));
    for (var i = 0; i < 12; i++) {
      years.push(new Date(date.getFullYear() + (i - 1), 0, 1));
    }
    return years;
  }

  function getDaysOfWeek(date) {
    date = new Date(date || new Date());
    date = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    date.setDate(date.getDate() - (date.getDay() - 1));
    var days = [];
    for (var i = 0; i < 7; i++) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }

  function getVisibleMonths(date) {
    date = new Date(date || new Date());
    var year = date.getFullYear();
    var months = [];
    for (var month = 0; month < 12; month++) {
      months.push(new Date(year, month, 1));
    }
    return months;
  }

  function getVisibleHours(date) {
    date = new Date(date || new Date());
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    var hours = [];
    for (var i = 0; i < 24; i++) {
      hours.push(date);
      date = new Date(date.getTime() + 60 * 60 * 1000);
    }
    return hours;
  }

  function bindTimeEntries(weeks,data,scope) {
    if(!data) return;
    if(!weeks) return;
    var weekEntries = [];
    var monthlyTotalEffort = 0;
    for( var j=0;j<weeks.length;j++) {
      var week = [];
      var weeklyTotalEffort = 0;
      for (var i = 0; i < weeks[j].length; i++) {
        var effort = 0;
        for(var x=0;x<data.length;x++){
          var dateParts = data[x]._id.split('-');
          var currentDate = new Date(weeks[j][i].day);
          currentDate.setHours(0,0,0);
          weeks[j][i].day = currentDate;
          if(new Date(dateParts[0],dateParts[1]-1,dateParts[2]).getTime() === new Date(weeks[j][i].day).getTime()){
            effort = data[x].effort;
            break;
          }
        }
        if(effort > 0){//to get day wise total effort
          //TODO:: need to calculate the total effort
          weeklyTotalEffort+=effort;
          week.push({day:new Date(weeks[j][i].day),effort:effort,isDate:true});
        }else if(weeks[j][i].isDate){
          week.push({day:new Date(weeks[j][i].day),isDate:true});
        }else{
          week.push({day:weeklyTotalEffort,isDate:false});
        }
      }
      weekEntries.push(week);
      monthlyTotalEffort+=weeklyTotalEffort;
    }
    scope.grandTotal = monthlyTotalEffort;
    return weekEntries;
  }
  Module.directive('datePicker', function datePickerDirective(datePickerConfig,$parse) {

    //noinspection JSUnusedLocalSymbols
    return {
      // this is a bug ?
      template: '<div ng-include="template"></div>',
      scope: {
        model: '=datePicker',
        minDate:'=minDate',
        maxDate:'=maxDate',
        entries:'@entries',
        after: '=?',
        before: '=?'
      },
      compile: function(tElem, tAttrs){
        return {
          pre: function(scope, iElem, iAttrs){
            //scope.min = new Date();
          },
          post: function(scope, element, attrs){

            scope.entries = scope.$eval(attrs.entries);
            scope.pickerMode = 'datepickermode';
            if(scope.minDate){
              scope.min = scope.minDate;
              scope.min.setHours(0);
              scope.min.setMinutes(0);
            }else{
              scope.min = datePickerConfig.min;
            }
            if(scope.maxDate){
              scope.max = scope.maxDate;
              scope.max.setHours(23);
              scope.max.setMinutes(59);
            }else{
              scope.max = datePickerConfig.max;
            }

            if(attrs.mode){
              scope.isNextEnabled = (attrs.mode !== 'day' && attrs.mode !== 'month');
              scope.isPrevEnabled = (attrs.mode !== 'day'  && attrs.mode !== 'month');
            }else{
              scope.isNextEnabled = true;
              scope.isPrevEnabled = true;
            }

            if(attrs.mode){
              scope.pickerMode = attrs.mode;
            }else{
              scope.pickerMode = 'datepickermode';
            }
            scope.date = new Date(scope.model || new Date());
            scope.views = datePickerConfig.views.concat();
            scope.view = attrs.view || datePickerConfig.view;
            scope.now = new Date();
            scope.template = attrs.template || datePickerConfig.template;

            scope.condition = ((new Date(scope.date).getTime()) -scope.min.getTime() >= 0 && (scope.max.getTime() -(new Date(scope.date).getTime())) >= 0);

            //scope.mindate = attrs.minDate || new Date();
            var step = parseInt(attrs.step || datePickerConfig.step, 10);

            /** @namespace attrs.minView, attrs.maxView*/
            scope.views =scope.views.slice(
              scope.views.indexOf(attrs.maxView || 'year'),
              scope.views.indexOf(attrs.minView || 'minutes')+1
            );

            if (scope.views.length === 1 || scope.views.indexOf(scope.view)===-1) {
              scope.view = scope.views[0];
            }

            scope.setView = function (nextView) {
              if (scope.views.indexOf(nextView) !== -1) {
                scope.view = nextView;
              }
            };

            scope.setDate = function (date) {
              var condition = false;
              var present = new Date();
              date.setHours(present.getUTCHours());
              date.setMinutes(present.getUTCMinutes());
              if(scope.min <= date && date <= scope.max){
                condition = true;
              }
              if(condition){
                scope.date = date;
                // change next view
                var nextView = scope.views[scope.views.indexOf(scope.view) + 1];
                if (!nextView || scope.model) {

                  scope.model = new Date(scope.model || date);

                  //noinspection FallThroughInSwitchStatementJS
                  switch (scope.view) {
                    case 'minutes':
                      scope.model.setMinutes(date.getMinutes());
                    // falls through
                    case 'hours':
                      scope.model.setHours(date.getHours());
                    // falls through
                    case 'date':
                      scope.model.setDate(date.getDate());
                    // falls through
                    case 'month':
                      scope.model.setMonth(date.getMonth());
                    //falls through
                    case 'year':
                      scope.model.setFullYear(date.getFullYear());
                  }
                  scope.$emit('setDate', scope.model, scope.view);
                  if(scope.pickerMode.toLowerCase() === 'month'){
                    scope.$emit('viewChanged', date);
                  }
                }

                if (nextView) {
                  scope.setView(nextView);
                }
              }else{
                return;
              }

              /*scope.date = date;
               // change next view
               var nextView = scope.views[scope.views.indexOf(scope.view) + 1];
               if (!nextView || scope.model) {

               scope.model = new Date(scope.model || date);

               //noinspection FallThroughInSwitchStatementJS
               switch (scope.view) {
               case 'minutes':
               scope.model.setMinutes(date.getMinutes());
               // falls through
               case 'hours':
               scope.model.setHours(date.getHours());
               // falls through
               case 'date':
               scope.model.setDate(date.getDate());
               // falls through
               case 'month':
               scope.model.setMonth(date.getMonth());
               //falls through
               case 'year':
               scope.model.setFullYear(date.getFullYear());
               }
               scope.$emit('setDate', scope.model, scope.view);
               }

               if (nextView) {
               scope.setView(nextView);
               }*/

            };

            function update() {
              var view = scope.view;
              var date = scope.date;
              switch (view) {
                case 'year':
                  scope.years = getVisibleYears(date);
                  break;
                case 'month':
                  scope.months = getVisibleMonths(date);
                  break;
                case 'date':
                  scope.weekdays = scope.weekdays || getDaysOfWeek();
                  scope.weeks = getVisibleWeeks(date);
                  if(scope.pickerMode && scope.pickerMode.toLowerCase() === 'month'){
                    for(var y=0;y<scope.weeks.length;y++){
                      scope.weeks[y].push({day:"0",isDate:false});
                    }
                    //need to add total column
                    scope.weekdays = ['Mon','Tue','Wed','Thr','Fri','Sat','Sun','Total'];
                  }

                  break;
                case 'hours':
                  scope.hours = getVisibleHours(date);
                  break;
                case 'minutes':
                  scope.minutes = getVisibleMinutes(date, step);
                  break;
              }
            }

            function watch() {
              if (scope.view !== 'date') {
                return scope.view;
              }
              return scope.model ? scope.model.getMonth() : null;
            }


            scope.$watch(watch, update);
            if(scope.minDate) {
              scope.$watch('minDate', function (newValue, oldValue) {
                if (newValue !== oldValue) {
                  scope.min = newValue;
                }

              });
            }
            if(scope.maxDate){
                scope.$watch('maxDate',function(newValue,oldValue){
                  if(newValue !== oldValue){
                    scope.max = newValue;
                  }

                });
            }


            if(scope.pickerMode && scope.pickerMode.toLowerCase() === 'month'){
              //FOR Entries binding
              attrs.$observe('entries', function(value) {
                scope.entries = scope.$eval(value);
                scope.grandTotal = 0;
                scope.weeks = bindTimeEntries(scope.weeks,angular.fromJson(value),scope);
              });
            }

            scope.next = function (delta) {
              var condition = true;

              if(attrs.mode && (attrs.mode === 'day' || attrs.mode === 'month')){
                condition = scope.isNextEnabled;
              }
              if(scope.max && condition && (scope.max >= scope.date)){
                var date = scope.date;
                delta = delta || 1;
                switch (scope.view) {
                  case 'year':
                  //falls through
                  case 'month':
                    date.setFullYear(date.getFullYear() + delta);
                    break;
                  case 'date':
                    date.setMonth(date.getMonth() + delta);
                    break;
                  case 'hours':
                  //falls through
                  case 'minutes':
                    date.setHours(date.getHours() + delta);
                    break;
                }
                if(scope.pickerMode && scope.pickerMode.toLowerCase() === 'month'){
                  scope.$emit('viewChanged',date);
                }
                update();

              }else{
                return;
              }
              /*var date = scope.date;
               delta = delta || 1;
               switch (scope.view) {
               case 'year':
               //falls through
               case 'month':
               date.setFullYear(date.getFullYear() + delta);
               break;
               case 'date':
               date.setMonth(date.getMonth() + delta);
               break;
               case 'hours':
               //falls through
               case 'minutes':
               date.setHours(date.getHours() + delta);
               break;
               }
               update();*/
            };

            scope.prev = function (delta) {
              if(scope.min && (scope.min < scope.date)){
                return scope.next(-delta || -1);
              }else{
                return;
              }
              /*return scope.next(-delta || -1);*/
            };

            scope.isAfter = function (date) {
              return scope.after ? scope.after.getTime() <= date.getTime() : false;
            };

            scope.isBefore = function (date) {
              return scope.before ? scope.before.getTime() >= date.getTime() : false;
            };

            scope.isSameMonth = function (date) {
              return scope.isSameYear(date) && scope.model.getMonth() === date.getMonth();
            };

            scope.isSameYear = function (date) {
              return (scope.model ? scope.model.getFullYear() === date.getFullYear() : false);
            };

            scope.isSameDay = function (date) {
              return scope.isSameMonth(date) && scope.model.getDate() === date.getDate();
            };

            scope.isSameHour = function (date) {
              return scope.isSameDay(date) && scope.model.getHours() === date.getHours();
            };

            scope.isSameMinutes = function (date) {
              return scope.isSameHour(date) && scope.model.getMinutes() === date.getMinutes();
            };

            scope.isNow = function (date) {
              var is = true;
              var now = scope.now;
              //noinspection FallThroughInSwitchStatementJS
              switch (scope.view) {
                case 'minutes':
                  is &= ~~(date.getMinutes()/step) === ~~(now.getMinutes()/step);
                /*  falls through*/
                case 'hours':
                  is &= date.getHours() === now.getHours();
                /* falls through*/
                case 'date':
                  is &= date.getDate() === now.getDate();
                /*falls through*/
                case 'month':
                  is &= date.getMonth() === now.getMonth();
                /* falls through*/
                case 'year':
                  is &= date.getFullYear() === now.getFullYear();
              }
              return is;
            };
            scope.isDisabledDate = function(date){
              return (date >= scope.min && date <= scope.max) ? false : true;
            };
          }
        }
      },
      link: function (scope, element, attrs) {/*

       scope.date = new Date(scope.model || new Date());
       scope.isDisabled = true;
       scope.views = datePickerConfig.views.concat();
       scope.view = attrs.view || datePickerConfig.view;
       scope.now = new Date();
       scope.template = attrs.template || datePickerConfig.template;

       //scope.mindate = attrs.minDate || new Date();
       var step = parseInt(attrs.step || datePickerConfig.step, 10);

       * @namespace attrs.minView, attrs.maxView
       scope.views =scope.views.slice(
       scope.views.indexOf(attrs.maxView || 'year'),
       scope.views.indexOf(attrs.minView || 'minutes')+1
       );

       if (scope.views.length === 1 || scope.views.indexOf(scope.view)===-1) {
       scope.view = scope.views[0];
       }

       scope.setView = function (nextView) {
       if (scope.views.indexOf(nextView) !== -1) {
       scope.view = nextView;
       }
       };
       scope.isDisabled = function(day){
       return day.getDate() > scope.mindate;
       };
       scope.setDate = function (date) {
       scope.date = date;
       // change next view
       var nextView = scope.views[scope.views.indexOf(scope.view) + 1];
       if (!nextView || scope.model) {

       scope.model = new Date(scope.model || date);

       //noinspection FallThroughInSwitchStatementJS
       switch (scope.view) {
       case 'minutes':
       scope.model.setMinutes(date.getMinutes());
       falls through
       case 'hours':
       scope.model.setHours(date.getHours());
       falls through
       case 'date':
       scope.model.setDate(date.getDate());
       falls through
       case 'month':
       scope.model.setMonth(date.getMonth());
       falls through
       case 'year':
       scope.model.setFullYear(date.getFullYear());
       }
       scope.$emit('setDate', scope.model, scope.view);
       }

       if (nextView) {
       scope.setView(nextView);
       }
       };

       function update() {
       var view = scope.view;
       var date = scope.date;
       switch (view) {
       case 'year':
       scope.years = getVisibleYears(date);
       break;
       case 'month':
       scope.months = getVisibleMonths(date);
       break;
       case 'date':
       scope.weekdays = scope.weekdays || getDaysOfWeek();
       scope.weeks = getVisibleWeeks(date);
       break;
       case 'hours':
       scope.hours = getVisibleHours(date);
       break;
       case 'minutes':
       scope.minutes = getVisibleMinutes(date, step);
       break;
       }
       }

       function watch() {
       if (scope.view !== 'date') {
       return scope.view;
       }
       return scope.model ? scope.model.getMonth() : null;
       }


       scope.$watch(watch, update);

       scope.next = function (delta) {
       var date = scope.date;
       delta = delta || 1;
       switch (scope.view) {
       case 'year':
       falls through
       case 'month':
       date.setFullYear(date.getFullYear() + delta);
       break;
       case 'date':
       date.setMonth(date.getMonth() + delta);
       break;
       case 'hours':
       falls through
       case 'minutes':
       date.setHours(date.getHours() + delta);
       break;
       }
       update();
       };

       scope.prev = function (delta) {
       return scope.next(-delta || -1);
       };

       scope.isAfter = function (date) {
       return scope.after ? scope.after.getTime() <= date.getTime() : false;
       };

       scope.isBefore = function (date) {
       return scope.before ? scope.before.getTime() >= date.getTime() : false;
       };

       scope.isSameMonth = function (date) {
       return scope.isSameYear(date) && scope.model.getMonth() === date.getMonth();
       };

       scope.isSameYear = function (date) {
       return (scope.model ? scope.model.getFullYear() === date.getFullYear() : false);
       };

       scope.isSameDay = function (date) {
       return scope.isSameMonth(date) && scope.model.getDate() === date.getDate();
       };

       scope.isSameHour = function (date) {
       return scope.isSameDay(date) && scope.model.getHours() === date.getHours();
       };

       scope.isSameMinutes = function (date) {
       return scope.isSameHour(date) && scope.model.getMinutes() === date.getMinutes();
       };

       scope.isNow = function (date) {
       var is = true;
       var now = scope.now;
       //noinspection FallThroughInSwitchStatementJS
       switch (scope.view) {
       case 'minutes':
       is &= ~~(date.getMinutes()/step) === ~~(now.getMinutes()/step);
       falls through
       case 'hours':
       is &= date.getHours() === now.getHours();
       falls through
       case 'date':
       is &= date.getDate() === now.getDate();
       falls through
       case 'month':
       is &= date.getMonth() === now.getMonth();
       falls through
       case 'year':
       is &= date.getFullYear() === now.getFullYear();
       }
       return is;
       };*/
      }
    };
  });

  'use strict';

  var Module = angular.module('datePicker');

  Module.directive('dateRange', function () {
    return {
      templateUrl: 'templates/daterange.html',
      scope: {
        start: '=',
        end: '='
      },
      link: function (scope) {
        scope.$watch('start.getTime()', function (value) {
          if (value && scope.end && value > scope.end.getTime()) {
            scope.end = new Date(value);
          }
        });
        scope.$watch('end.getTime()', function (value) {
          if (value && scope.start && value < scope.start.getTime()) {
            scope.start = new Date(value);
          }
        });
      }
    };
  });

  'use strict';

  var PRISTINE_CLASS = 'ng-pristine',
    DIRTY_CLASS = 'ng-dirty';

  var Module = angular.module('datePicker');

  Module.constant('dateTimeConfig', {
    template: function (attrs) {
      return '' +
        '<div ' +
        'date-picker="' + attrs.ngModel + '" ' +
        (attrs.view ? 'view="' + attrs.view + '" ' : '') +
        (attrs.maxView ? 'max-view="' + attrs.maxView + '" ' : '') +
        (attrs.template ? 'template="' + attrs.template + '" ' : '') +
        (attrs.minView ? 'min-view="' + attrs.minView + '" ' : '') +
        (attrs.minDate ? 'min-date="'+attrs.minDate+'"':'') +
        (attrs.maxDate ? 'max-date="'+attrs.maxDate+'"':'') +
          /*'min-date="' + attrs.minDate + '" ' +
           'max-date="' + attrs.maxDate + '" ' +*/
          //(attrs.mode ? 'mode="' + attrs.mode + '" ':'') +
        'class="dropdown-menu"></div>';
    },
    format: 'yyyy-MM-dd HH:mm',
    views: ['date', 'year', 'month', 'hours', 'minutes'],
    dismiss: false,
    position: 'relative'
  });

  Module.directive('dateTimeAppend', function () {
    return {
      link: function (scope, element) {
        element.bind('click', function () {
          element.find('input')[0].focus();
        });
      }
    };
  });

  Module.directive('dateTime', function ($compile, $document, $filter, dateTimeConfig, $parse) {
    var body = $document.find('body');
    var dateFilter = $filter('date');

    return {
      require: 'ngModel',
      scope:true,
      link: function (scope, element, attrs, ngModel) {
        var format = attrs.format || dateTimeConfig.format;
        var parentForm = element.inheritedData('$formController');
        var views = $parse(attrs.views)(scope) || dateTimeConfig.views.concat();
        var view = attrs.view || views[0];
        var minview = attrs.minView || views[0];
        var index = views.indexOf(view);
        var dismiss = attrs.dismiss ? $parse(attrs.dismiss)(scope) : dateTimeConfig.dismiss;
        var picker = null;
        var position = attrs.position || dateTimeConfig.position;
        var container = null;
        if (index === -1) {
          views.splice(index, 1);
        }

        views.unshift(view);


        function formatter(value) {
          return dateFilter(value, format);
        }

        function parser() {
          return ngModel.$modelValue;
        }

        ngModel.$formatters.push(formatter);
        ngModel.$parsers.unshift(parser);


        var template = dateTimeConfig.template(attrs);

        function updateInput(event) {
          event.stopPropagation();
          if (ngModel.$pristine) {
            ngModel.$dirty = true;
            ngModel.$pristine = false;
            element.removeClass(PRISTINE_CLASS).addClass(DIRTY_CLASS);
            if (parentForm) {
              parentForm.$setDirty();
            }
            ngModel.$render();
          }
        }

        function clear() {
          if (picker) {
            picker.remove();
            picker = null;
          }
          if (container) {
            container.remove();
            container = null;
          }
        }

        function showPicker() {
          if (picker) {
            return;
          }
          // create picker element
          picker = $compile(template)(scope);
          scope.$digest();

          scope.$on('setDate', function (event, date, view) {
            updateInput(event);
            if (dismiss && minview === view) {
              clear();
            }
          });

          scope.$on('$destroy', clear);

          // move picker below input element

          if (position === 'absolute') {
            var pos = angular.extend(element.offset(), { height: element[0].offsetHeight });
            picker.css({ top: pos.top + pos.height, left: pos.left, display: 'block', position: position});
            body.append(picker);
          } else {
            // relative
            container = angular.element('<div date-picker-wrapper></div>');
            element[0].parentElement.insertBefore(container[0], element[0]);
            container.append(picker);
//          this approach doesn't work
//          element.before(picker);
            picker.css({top: element[0].offsetHeight + 'px', display: 'block'});
          }

          picker.bind('mousedown', function (evt) {
            evt.preventDefault();
          });
        }
        scope.isDate = function(date){
          date = new Date(date);
          return angular.isDate();
        }

        scope.setDate = function (date) {
          scope.date = date;
          // change next view
          var nextView = scope.views[scope.views.indexOf(scope.view) + 1];
          if (!nextView || scope.model) {

            scope.model = new Date(scope.model || date);

            //noinspection FallThroughInSwitchStatementJS
            switch (scope.view) {
              case 'minutes':
                scope.model.setMinutes(date.getMinutes());
              //falls through
              case 'hours':
                scope.model.setHours(date.getHours());
              //falls through
              case 'date':
                scope.model.setDate(date.getDate());
              //falls through
              case 'month':
                scope.model.setMonth(date.getMonth());
              //falls through
              case 'year':
                scope.model.setFullYear(date.getFullYear());
            }
            scope.$emit('setDate', scope.model, scope.view);
          }

          if (nextView) {
            scope.setView(nextView);
          }
        };

        element.bind('focus', showPicker);
        element.bind('click', showPicker);
        element.bind('blur', clear);
      }
    };
  });

  angular.module("datePicker").run(["$templateCache", function($templateCache) {

    $templateCache.put("templates/datepicker.html",
      "<div ng-switch=\"view\">\n" +
      "  <div ng-switch-when=\"date\">\n" +
      "    <table>\n" +
      "      <thead>\n" +
      "      <tr>\n" +
      "        <th ng-click=\"prev()\">‹</th>\n" +
      "        <th colspan=\"5\" class=\"switch\" ng-click=\"setView('month')\">{{date|date:\"yyyy MMMM\"}}</th>\n" +
      "        <th ng-click=\"next()\">›</i></th>\n" +
      "      </tr>{{mode}}\n" +
      "      <tr ng-switch=\"pickerMode\">\n" +
      "        <th ng-switch-when=\"month\" ng-repeat=\"day in weekdays\" style=\"overflow: hidden\">{{ day }}</th>\n" +
      "        <th ng-switch-when=\"day\" ng-repeat=\"day in weekdays\" style=\"overflow: hidden\">{{ day|date:\"EEE\" }}</th>\n" +
      "        <th ng-switch-when=\"datepickermode\" ng-repeat=\"day in weekdays\" style=\"overflow: hidden\">{{ day|date:\"EEE\" }}</th>\n" +
      "      </tr>\n" +
      "      </thead>\n" +
      "      <tbody ng-switch=\"pickerMode\">\n" +
      "      <tr ng-switch-when=\"month\"  ng-repeat=\"week in weeks\">\n" +
      "        <td style=\"border:1px solid #ccc;\" ng-repeat=\"day in week\">\n" +
      "          <span ng-if=\"day.isDate\" style=\"display:inline-block; background-color:#ffffff; text-align:center;\" \n" +
      "            ng-class=\"{'now':isNow(day.day),'active':isSameDay(day.day),'disabled':isDisabledDate(day.day),'after':isAfter(day.day),'before':isBefore(day.day)}\"\n" +
      "            ng-click=\"setDate(day.day)\" ng-bind=\"day.day.getDate()\">{{day.day}}</span>\n" +
      "        <span ng-if=\"day.isDate\" style=\"display:inline-block; background-color:#f3f3f3; text-align:right; font-size:9px;\">{{day.effort}}</span>"+
      "          <span ng-if=\"!day.isDate\" >{{day.day}}</span>"  +
      "        </td>\n" +
      "      </tr>\n" +
      "      <tr ng-switch-when=\"month\"><td colspan='2'></td><td colspan='5' class='text-right'>Total for {{date|date:\" MMMM yyyy\"}}:</td></td><td>{{grandTotal}}</td></tr>"+
      "      <tr ng-switch-when=\"day\" ng-repeat=\"week in weeks\">\n" +
      "        <td style=\"border:1px solid #ccc;\" ng-repeat=\"day in week\">\n" +
      "          <span style=\"display:inline-block; background-color:#ffffff; text-align:center;\" \n" +
      "            ng-class=\"{'now':isNow(day.day),'active':isSameDay(day.day),'disabled':isDisabledDate(day.day),'after':isAfter(day.day),'before':isBefore(day.day)}\"\n" +
      "            ng-click=\"setDate(day.day)\" ng-bind=\"day.day.getDate()\"></span>\n" +
      "        </td>\n" +
      "      </tr>\n" +
      "      <tr ng-switch-when=\"datepickermode\" ng-repeat=\"week in weeks\">\n" +
      "        <td style=\"border:1px solid #ccc;\" ng-repeat=\"day in week\">\n" +
      "          <span style=\"display:inline-block; background-color:#ffffff; text-align:center;\" \n" +
      "            ng-class=\"{'now':isNow(day.day),'active':isSameDay(day.day),'disabled':isDisabledDate(day.day),'after':isAfter(day.day),'before':isBefore(day.day)}\"\n" +
      "            ng-click=\"setDate(day.day)\" ng-bind=\"day.day.getDate()\"></span>\n" +
      "        </td>\n" +
      "      </tr>\n" +
      "      </tbody>\n" +
      "    </table>\n" +
      "  </div>\n" +
      "  <div ng-switch-when=\"year\">\n" +
      "    <table>\n" +
      "      <thead>\n" +
      "      <tr>\n" +
      "        <th ng-click=\"prev(10)\">‹</th>\n" +
      "        <th colspan=\"5\" class=\"switch\">{{years[0].getFullYear()}}-{{years[years.length-1].getFullYear()}}</th>\n" +
      "        <th ng-click=\"next(10)\">›</i></th>\n" +
      "      </tr>\n" +
      "      </thead>\n" +
      "      <tbody>\n" +
      "      <tr>\n" +
      "        <td colspan=\"7\">\n" +
      "                    <span ng-class=\"{'active':isSameYear(year),'now':isNow(year)}\"\n" +
      "                          ng-repeat=\"year in years\"\n" +
      "                          ng-click=\"setDate(year)\" ng-bind=\"year.getFullYear()\"></span>\n" +
      "\n" +
      "\n" +
      "        </td>\n" +
      "      </tr>\n" +
      "      </tbody>\n" +
      "    </table>\n" +
      "  </div>\n" +
      "  <div ng-switch-when=\"month\">\n" +
      "    <table>\n" +
      "      <thead>\n" +
      "      <tr>\n" +
      "        <th ng-click=\"prev()\">‹</th>\n" +
      "        <th colspan=\"5\" class=\"switch\" ng-click=\"setView('year')\">{{ date|date:\"yyyy\" }}</th>\n" +
      "        <th ng-click=\"next()\">›</i></th>\n" +
      "      </tr>\n" +
      "      </thead>\n" +
      "      <tbody>\n" +
      "      <tr>\n" +
      "        <td colspan=\"7\">\n" +
      "                <span ng-repeat=\"month in months\"\n" +
      "                      ng-class=\"{'active':isSameMonth(month),'after':isAfter(month),'before':isBefore(month),'now':isNow(month)}\"\n" +
      "                      ng-click=\"setDate(month)\">{{month|date:'MMM'}}</span>\n" +
      "\n" +
      "        </td>\n" +
      "      </tr>\n" +
      "      </tbody>\n" +
      "    </table>\n" +
      "  </div>\n" +
      "  <div ng-switch-when=\"hours\">\n" +
      "    <table>\n" +
      "      <thead>\n" +
      "      <tr>\n" +
      "        <th ng-click=\"prev(24)\">‹</th>\n" +
      "        <th colspan=\"5\" class=\"switch\" ng-click=\"setView('date')\">{{ date|date:\"dd MMMM yyyy\" }}</th>\n" +
      "        <th ng-click=\"next(24)\">›</i></th>\n" +
      "      </tr>\n" +
      "      </thead>\n" +
      "      <tbody>\n" +
      "      <tr>\n" +
      "        <td colspan=\"7\">\n" +
      "                <span ng-repeat=\"hour in hours\"\n" +
      "                      ng-class=\"{'now':isNow(hour),'active':isSameHour(hour)}\"\n" +
      "                      ng-click=\"setDate(hour)\" ng-bind=\"hour.getHours()+':00'\"></span>\n" +
      "        </td>\n" +
      "      </tr>\n" +
      "      </tbody>\n" +
      "    </table>\n" +
      "  </div>\n" +
      "  <div ng-switch-when=\"minutes\">\n" +
      "    <table>\n" +
      "      <thead>\n" +
      "      <tr>\n" +
      "        <th ng-click=\"prev()\">‹</th>\n" +
      "        <th colspan=\"5\" class=\"switch\" ng-click=\"setView('hours')\">{{ date|date:\"dd MMMM yyyy\" }}\n" +
      "        </th>\n" +
      "        <th ng-click=\"next()\">›</i></th>\n" +
      "      </tr>\n" +
      "      </thead>\n" +
      "      <tbody>\n" +
      "      <tr>\n" +
      "        <td colspan=\"7\">\n" +
      "                    <span ng-repeat=\"minute in minutes\"\n" +
      "                          ng-class=\"{active:isSameMinutes(minute),'now':isNow(minute)}\"\n" +
      "                          ng-click=\"setDate(minute)\">{{minute|date:\"HH:mm\"}}</span>\n" +
      "        </td>\n" +
      "      </tr>\n" +
      "      </tbody>\n" +
      "    </table>\n" +
      "  </div>\n" +
      "</div>\n"
    );

    $templateCache.put("templates/daterange.html",
      "<div>\n" +
      "    <table>\n" +
      "        <tr>\n" +
      "            <td valign=\"top\">\n" +
      "                <div date-picker=\"start\" class=\"date-picker\" date after=\"start\" before=\"end\" min-view=\"date\" max-view=\"date\"></div>\n" +
      "            </td>\n" +
      "            <td valign=\"top\">\n" +
      "                <div date-picker=\"end\" class=\"date-picker\" date after=\"start\" before=\"end\"  min-view=\"date\" max-view=\"date\"></div>\n" +
      "            </td>\n" +
      "        </tr>\n" +
      "    </table>\n" +
      "</div>\n"
    );

  }]);
})(angular);
