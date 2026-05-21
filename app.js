(function () {
  "use strict";

  var DB_NAME = "theater-manager-db";
  var DB_VERSION = 3;
  var STORES = ["shows", "events", "resources", "rooms", "unavailability"];
  var START_HOUR = 7;
  var END_HOUR = 24;
  var TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;

  var RESOURCE_CATEGORIES = [
    { id: "elettricisti", label: "Elettricisti" },
    { id: "macchinisti", label: "Macchinisti" },
    { id: "audiovisivi", label: "Audiovisivi" },
    { id: "costumi", label: "Costumi" },
    { id: "sala", label: "Sala" }
  ];

  var RESOURCE_GROUPS = [
    {
      type: "person",
      label: "Persone",
      categories: RESOURCE_CATEGORIES
    },
    {
      type: "material",
      label: "Materiali",
      categories: RESOURCE_CATEGORIES
    },
    {
      type: "expense",
      label: "Spese",
      categories: RESOURCE_CATEGORIES
    }
  ];

  var DEFAULT_ROOMS = [
    { id: "room-main", name: "Sala Grande", capacity: 820 },
    { id: "room-ridotto", name: "Ridotto", capacity: 180 },
    { id: "room-prove", name: "Sala Prove", capacity: 90 },
    { id: "room-palco", name: "Palco Esterno", capacity: 420 }
  ];

  var DEFAULT_RESOURCES = [
    { id: "res-electricians", type: "person", category: "elettricisti", name: "Squadra elettricisti", notes: "" },
    { id: "res-stage", type: "person", category: "macchinisti", name: "Squadra macchinisti", notes: "" },
    { id: "res-av-tech", type: "person", category: "audiovisivi", name: "Tecnici audiovisivi", notes: "" },
    { id: "res-costumes", type: "person", category: "costumi", name: "Sartoria costumi", notes: "" },
    { id: "res-hall-team", type: "person", category: "sala", name: "Personale sala", notes: "" },
    { id: "res-electric-kit", type: "material", category: "elettricisti", name: "Quadro elettrico mobile", notes: "" },
    { id: "res-stage-kit", type: "material", category: "macchinisti", name: "Attrezzatura di palco", notes: "" },
    { id: "res-av-kit", type: "material", category: "audiovisivi", name: "Impianto audio/video", notes: "" },
    { id: "res-costume-rack", type: "material", category: "costumi", name: "Stand costumi", notes: "" },
    { id: "res-hall-barriers", type: "material", category: "sala", name: "Transenne sala", notes: "" },
    { id: "res-expense-electricians", type: "expense", category: "elettricisti", name: "Costo elettricisti", notes: "" },
    { id: "res-expense-stage", type: "expense", category: "macchinisti", name: "Costo macchinisti", notes: "" },
    { id: "res-expense-av", type: "expense", category: "audiovisivi", name: "Costo audiovisivi", notes: "" },
    { id: "res-expense-costumes", type: "expense", category: "costumi", name: "Costo costumi", notes: "" },
    { id: "res-expense-hall", type: "expense", category: "sala", name: "Costo sala", notes: "" }
  ];

  var COLORS = [
    "#8d1f2d",
    "#246a5f",
    "#5f4a8b",
    "#965f1f",
    "#2f5f95",
    "#a44a3f",
    "#386641",
    "#6d597a",
    "#bc6c25",
    "#4d7c8a",
    "#7f5539",
    "#3d405b"
  ];

  var state = {
    storage: null,
    storageLabel: "DB locale attivo",
    section: "calendar",
    view: "week",
    cursor: new Date(),
    shows: [],
    events: [],
    resources: [],
    rooms: [],
    unavailability: [],
    search: "",
    resourceGroupMode: "type",
    resourceTypeFilter: "",
    resourceCategoryFilter: "",
    assignmentEventId: null
  };

  var el = {};

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    collectElements();
    populateResourceFilterOptions();
    bindEvents();
    updateCategoryOptions();

    state.storage = await initStorage();
    el.storageStatus.textContent = state.storageLabel;

    await loadData();
    renderAll();
  }

  function collectElements() {
    el.storageStatus = document.getElementById("storageStatus");
    el.pageTitle = document.getElementById("pageTitle");
    el.globalSearch = document.getElementById("globalSearch");
    el.addEventButton = document.getElementById("addEventButton");
    el.addShowButton = document.getElementById("addShowButton");
    el.showForm = document.getElementById("showForm");
    el.showResourceGrid = document.getElementById("showResourceGrid");
    el.showList = document.getElementById("showList");
    el.metrics = document.getElementById("metrics");
    el.periodTitle = document.getElementById("periodTitle");
    el.calendarRoot = document.getElementById("calendarRoot");
    el.previousPeriod = document.getElementById("previousPeriod");
    el.nextPeriod = document.getElementById("nextPeriod");
    el.todayButton = document.getElementById("todayButton");
    el.eventModal = document.getElementById("eventModal");
    el.eventForm = document.getElementById("eventForm");
    el.eventFormError = document.getElementById("eventFormError");
    el.eventShow = document.getElementById("eventShow");
    el.eventDateList = document.getElementById("eventDateList");
    el.addEventDateButton = document.getElementById("addEventDateButton");
    el.eventDetailModal = document.getElementById("eventDetailModal");
    el.eventDetailBody = document.getElementById("eventDetailBody");
    el.resourceScheduleModal = document.getElementById("resourceScheduleModal");
    el.resourceScheduleBody = document.getElementById("resourceScheduleBody");
    el.unavailabilityModal = document.getElementById("unavailabilityModal");
    el.unavailabilityForm = document.getElementById("unavailabilityForm");
    el.unavailabilityList = document.getElementById("unavailabilityList");
    el.unavailabilityError = document.getElementById("unavailabilityError");
    el.assignmentModal = document.getElementById("assignmentModal");
    el.assignmentSummary = document.getElementById("assignmentSummary");
    el.assignmentForm = document.getElementById("assignmentForm");
    el.assignmentGrid = document.getElementById("assignmentGrid");
    el.assignmentError = document.getElementById("assignmentError");
    el.resourceForm = document.getElementById("resourceForm");
    el.resetResourceForm = document.getElementById("resetResourceForm");
    el.cancelResourceForm = document.getElementById("cancelResourceForm");
    el.resourceType = document.getElementById("resourceType");
    el.resourceCategory = document.getElementById("resourceCategory");
    el.resourceCost = document.getElementById("resourceCost");
    el.resourceFilterType = document.getElementById("resourceFilterType");
    el.resourceFilterCategory = document.getElementById("resourceFilterCategory");
    el.resourceList = document.getElementById("resourceList");
    el.roomForm = document.getElementById("roomForm");
    el.resetRoomForm = document.getElementById("resetRoomForm");
    el.cancelRoomForm = document.getElementById("cancelRoomForm");
    el.roomList = document.getElementById("roomList");
    el.conflictList = document.getElementById("conflictList");
    el.upcomingList = document.getElementById("upcomingList");
    el.exportDataButton = document.getElementById("exportDataButton");
    el.importDataButton = document.getElementById("importDataButton");
    el.importDataInput = document.getElementById("importDataInput");
  }

  function bindEvents() {
    document.querySelectorAll("[data-section]").forEach(function (button) {
      button.addEventListener("click", function () {
        state.section = button.getAttribute("data-section");
        renderSection();
      });
    });

    document.querySelectorAll("[data-view]").forEach(function (button) {
      button.addEventListener("click", function () {
        state.view = button.getAttribute("data-view");
        renderCalendar();
      });
    });

    document.querySelectorAll("[data-resource-group]").forEach(function (button) {
      button.addEventListener("click", function () {
        state.resourceGroupMode = button.getAttribute("data-resource-group") || "type";
        renderResources();
      });
    });

    el.resourceFilterType.addEventListener("change", function () {
      state.resourceTypeFilter = el.resourceFilterType.value;
      renderResources();
    });

    el.resourceFilterCategory.addEventListener("change", function () {
      state.resourceCategoryFilter = el.resourceFilterCategory.value;
      renderResources();
    });

    el.globalSearch.addEventListener("input", function () {
      state.search = el.globalSearch.value.trim().toLowerCase();
      renderAll();
    });

    el.addEventButton.addEventListener("click", function () {
      openEventModal();
    });

    el.addShowButton.addEventListener("click", function () {
      openNewShowForm();
    });

    el.previousPeriod.addEventListener("click", function () {
      movePeriod(-1);
    });

    el.nextPeriod.addEventListener("click", function () {
      movePeriod(1);
    });

    el.todayButton.addEventListener("click", function () {
      state.cursor = new Date();
      renderCalendar();
    });

    el.calendarRoot.addEventListener("click", function (event) {
      var eventButton = event.target.closest("[data-event-id]");
      if (eventButton) {
        openEventDetail(eventButton.getAttribute("data-event-id"));
        return;
      }

      var dateCell = event.target.closest("[data-date]");
      if (dateCell) {
        openEventModal(null, dateCell.getAttribute("data-date"));
      }
    });

    document.querySelectorAll("[data-close-modal]").forEach(function (button) {
      button.addEventListener("click", closeModals);
    });

    document.addEventListener("click", function (event) {
      if (event.target.closest("[data-close-modal]")) {
        closeModals();
      }
    });

    document.querySelectorAll(".modal-layer").forEach(function (layer) {
      layer.addEventListener("click", function (event) {
        if (event.target === layer) {
          closeModals();
        }
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeModals();
      }
    });

    el.showForm.addEventListener("submit", handleShowSubmit);
    el.eventForm.addEventListener("submit", handleEventSubmit);
    el.addEventDateButton.addEventListener("click", function () {
      addEventDateInput();
    });
    el.eventDateList.addEventListener("click", function (event) {
      var button = event.target.closest("[data-remove-event-date]");
      if (button) {
        button.closest(".event-date-row").remove();
      }
    });
    el.unavailabilityForm.addEventListener("submit", handleUnavailabilitySubmit);
    el.resourceForm.addEventListener("submit", handleResourceSubmit);
    el.roomForm.addEventListener("submit", handleRoomSubmit);
    el.assignmentForm.addEventListener("submit", handleAssignmentSubmit);

    el.resourceType.addEventListener("change", updateCategoryOptions);
    el.resetResourceForm.addEventListener("click", openNewResourceForm);
    el.resetRoomForm.addEventListener("click", openNewRoomForm);
    el.cancelResourceForm.addEventListener("click", function () {
      resetResourceForm();
      setResourceFormVisible(false);
    });

    el.cancelRoomForm.addEventListener("click", function () {
      resetRoomForm();
      setRoomFormVisible(false);
    });

    el.resourceList.addEventListener("click", handleResourceListClick);
    el.roomList.addEventListener("click", handleRoomListClick);
    el.showList.addEventListener("click", handleShowListClick);
    el.unavailabilityList.addEventListener("click", handleUnavailabilityListClick);
    el.eventDetailBody.addEventListener("click", handleEventDetailClick);
    el.resourceScheduleBody.addEventListener("click", function (event) {
      var button = event.target.closest("[data-event-id]");
      if (button) {
        closeModals();
        openEventDetail(button.getAttribute("data-event-id"));
      }
    });
    el.upcomingList.addEventListener("click", function (event) {
      var button = event.target.closest("[data-event-id]");
      if (button) {
        openEventDetail(button.getAttribute("data-event-id"));
      }
    });

    el.exportDataButton.addEventListener("click", exportData);
    el.importDataButton.addEventListener("click", function () {
      el.importDataInput.click();
    });
    el.importDataInput.addEventListener("change", importData);
    document.getElementById("resetUnavailabilityForm").addEventListener("click", resetUnavailabilityForm);
  }

  async function initStorage() {
    if (window.indexedDB) {
      try {
        var db = await openDatabase();
        state.storageLabel = "DB locale attivo";
        return createIndexedDbStorage(db);
      } catch (error) {
        console.warn("IndexedDB non disponibile, uso localStorage.", error);
      }
    }

    state.storageLabel = "DB locale attivo";
    return createLocalStorageStorage();
  }

  function openDatabase() {
    return new Promise(function (resolve, reject) {
      var request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = function () {
        var db = request.result;
        STORES.forEach(function (storeName) {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: "id" });
          }
        });
      };

      request.onsuccess = function () {
        resolve(request.result);
      };

      request.onerror = function () {
        reject(request.error);
      };

      request.onblocked = function () {
        reject(new Error("Database bloccato da un'altra scheda."));
      };
    });
  }

  function createIndexedDbStorage(db) {
    function request(storeName, mode, action) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(storeName, mode);
        var store = tx.objectStore(storeName);
        var result = action(store);

        tx.oncomplete = function () {
          resolve(result && result.result);
        };
        tx.onerror = function () {
          reject(tx.error);
        };
      });
    }

    return {
      all: function (storeName) {
        return request(storeName, "readonly", function (store) {
          return store.getAll();
        });
      },
      put: function (storeName, item) {
        return request(storeName, "readwrite", function (store) {
          return store.put(item);
        });
      },
      delete: function (storeName, id) {
        return request(storeName, "readwrite", function (store) {
          return store.delete(id);
        });
      },
      clear: function (storeName) {
        return request(storeName, "readwrite", function (store) {
          return store.clear();
        });
      }
    };
  }

  function createLocalStorageStorage() {
    function key(storeName) {
      return "theater-manager:" + storeName;
    }

    function read(storeName) {
      try {
        return JSON.parse(window.localStorage.getItem(key(storeName)) || "[]");
      } catch (error) {
        return [];
      }
    }

    function write(storeName, rows) {
      window.localStorage.setItem(key(storeName), JSON.stringify(rows));
    }

    return {
      all: function (storeName) {
        return Promise.resolve(read(storeName));
      },
      put: function (storeName, item) {
        var rows = read(storeName).filter(function (row) {
          return row.id !== item.id;
        });
        rows.push(item);
        write(storeName, rows);
        return Promise.resolve();
      },
      delete: function (storeName, id) {
        write(storeName, read(storeName).filter(function (row) {
          return row.id !== id;
        }));
        return Promise.resolve();
      },
      clear: function (storeName) {
        write(storeName, []);
        return Promise.resolve();
      }
    };
  }

  async function loadData() {
    state.shows = (await state.storage.all("shows")).map(normalizeShow);
    state.events = (await state.storage.all("events")).map(normalizeEvent);
    state.resources = (await state.storage.all("resources")).map(normalizeResource);
    state.rooms = (await state.storage.all("rooms")).map(normalizeRoom);
    state.unavailability = (await state.storage.all("unavailability")).map(normalizeUnavailability).filter(Boolean);

    if (!state.rooms.length) {
      state.rooms = DEFAULT_ROOMS.map(function (room) {
        return Object.assign({}, room);
      });
      await Promise.all(state.rooms.map(function (room) {
        return state.storage.put("rooms", room);
      }));
    }

    if (!state.resources.length) {
      state.resources = DEFAULT_RESOURCES.map(function (resource) {
        return Object.assign({}, resource);
      });
      await Promise.all(state.resources.map(function (resource) {
        return state.storage.put("resources", resource);
      }));
    }

    var migrated = ensureEventShows();
    await Promise.all(migrated.shows.map(function (show) {
      return state.storage.put("shows", show);
    }));
    await Promise.all(migrated.events.map(function (event) {
      return state.storage.put("events", event);
    }));

    sortData();
  }

  function normalizeShow(show) {
    var name = show.name || show.title || "Spettacolo";
    return {
      id: show.id || uid("show"),
      name: name,
      description: show.description || show.notes || "",
      resourceIds: Array.isArray(show.resourceIds) ? show.resourceIds : [],
      cost: Number(show.cost) || 0,
      color: isHexColor(show.color) ? show.color : defaultEventColor(name)
    };
  }

  function normalizeEvent(event) {
    return {
      id: event.id || uid("event"),
      showId: event.showId || "",
      title: event.title || "",
      roomId: event.roomId || event.room || "",
      start: event.start || new Date().toISOString(),
      duration: Number(event.duration) || 120,
      color: isHexColor(event.color) ? event.color : defaultEventColor(event.id || event.title || event.roomId),
      resourceIds: Array.isArray(event.resourceIds) ? event.resourceIds : [],
      notes: event.notes || ""
    };
  }

  function ensureEventShows() {
    var changed = {
      shows: [],
      events: []
    };

    state.events.forEach(function (event) {
      var show = findShow(event.showId);

      if (!show) {
        var legacyTitle = event.title || "Spettacolo";
        show = state.shows.filter(function (item) {
          return item.name.toLowerCase() === legacyTitle.toLowerCase();
        })[0] || null;

        if (!show) {
          show = normalizeShow({
            id: uid("show"),
            name: legacyTitle,
            description: event.notes || "",
            resourceIds: event.resourceIds || [],
            cost: 0,
            color: event.color
          });
          state.shows.push(show);
          changed.shows.push(show);
        }
      }

      if (event.showId !== show.id) {
        event.showId = show.id;
        changed.events.push(event);
      }
    });

    return changed;
  }

  function normalizeResource(resource) {
    var type = normalizeResourceType(resource.type);
    var category = validResourceCategory(type, resource.category) ? resource.category : "macchinisti";

    return {
      id: resource.id || uid("res"),
      type: type,
      category: category,
      name: resource.name || "Risorsa",
      notes: resource.notes || "",
      cost: Number(resource.cost) || 0
    };
  }

  function normalizeResourceType(type) {
    if (type === "object" || type === "material") {
      return "material";
    }
    if (type === "expense") {
      return "expense";
    }
    return "person";
  }

  function normalizeRoom(room) {
    return {
      id: room.id || uid("room"),
      name: room.name || "Sala",
      capacity: Number(room.capacity) || 0
    };
  }

  function normalizeUnavailability(period) {
    var targetType = period.targetType === "room" ? "room" : "resource";
    var start = new Date(period.start);
    var end = new Date(period.end);

    if (!period.targetId || isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      return null;
    }

    return {
      id: period.id || uid("unavailable"),
      targetType: targetType,
      targetId: period.targetId,
      start: start.toISOString(),
      end: end.toISOString(),
      reason: period.reason || ""
    };
  }

  function sortData() {
    state.shows.sort(function (a, b) {
      return a.name.localeCompare(b.name, "it");
    });
    state.events.sort(function (a, b) {
      return new Date(a.start).getTime() - new Date(b.start).getTime();
    });
    state.resources.sort(function (a, b) {
      return resourceTypeIndex(a.type) - resourceTypeIndex(b.type) ||
        resourceCategoryIndex(a.category) - resourceCategoryIndex(b.category) ||
        a.name.localeCompare(b.name, "it");
    });
    state.rooms.sort(function (a, b) {
      return a.name.localeCompare(b.name, "it");
    });
    sortUnavailability();
  }

  function sortUnavailability() {
    state.unavailability.sort(function (a, b) {
      return new Date(a.start).getTime() - new Date(b.start).getTime();
    });
  }

  function renderAll() {
    renderSection();
    renderMetrics();
    renderCalendar();
    renderShows();
    renderResources();
    renderRooms();
    renderArchive();
  }

  function renderSection() {
    var labels = {
      calendar: "Calendario",
      shows: "Spettacoli",
      rooms: "Sale",
      resources: "Risorse",
      archive: "Dati",
      guide: "Guida"
    };

    document.querySelectorAll("[data-section]").forEach(function (button) {
      var active = button.getAttribute("data-section") === state.section;
      button.classList.toggle("is-active", active);
      if (active) {
        button.setAttribute("aria-current", "page");
      } else {
        button.removeAttribute("aria-current");
      }
    });

    document.querySelectorAll("[data-section-panel]").forEach(function (panel) {
      panel.classList.toggle("is-active", panel.getAttribute("data-section-panel") === state.section);
    });

    el.pageTitle.textContent = labels[state.section] || "Calendario";
  }

  function renderMetrics() {
    var todayKey = dateKey(new Date());
    var todayEvents = state.events.filter(function (event) {
      return dateKey(new Date(event.start)) === todayKey;
    });
    var nextWeekEnd = addDays(startOfDay(new Date()), 7);
    var weekEvents = state.events.filter(function (event) {
      var start = new Date(event.start);
      return start >= startOfDay(new Date()) && start < nextWeekEnd;
    });
    var usedToday = unique(todayEvents.reduce(function (ids, event) {
      return ids.concat(eventResourceIds(event));
    }, [])).length;
    var conflicts = detectConflicts().length;

    el.metrics.innerHTML = [
      metric("Oggi", todayEvents.length, "spettacoli"),
      metric("Prossimi 7 giorni", weekEvents.length, "spettacoli"),
      metric("Risorse oggi", usedToday, "occupate"),
      metric("Conflitti", conflicts, "da risolvere")
    ].join("");
  }

  function metric(title, value, suffix) {
    return '<div class="metric"><span>' + escapeHtml(title) + '</span><strong>' + value + '</strong><span>' + escapeHtml(suffix) + '</span></div>';
  }

  function renderCalendar() {
    document.querySelectorAll("[data-view]").forEach(function (button) {
      button.classList.toggle("is-active", button.getAttribute("data-view") === state.view);
    });

    el.calendarRoot.className = "calendar-root" + (state.view === "day" || state.view === "week" ? " is-agenda-view" : "");
    el.periodTitle.textContent = periodLabel();

    if (state.view === "day" || state.view === "week") {
      renderAgendaView();
    } else if (state.view === "month") {
      renderMonthView();
    } else {
      renderYearView();
    }
  }

  function renderAgendaView() {
    var days = state.view === "day" ? [startOfDay(state.cursor)] : rangeDays(startOfWeek(state.cursor), 7);
    var header = '<div class="agenda-head" style="--day-count:' + days.length + '"><div class="agenda-corner">Ora</div>' +
      days.map(function (day) {
        return '<div class="agenda-head-cell"><strong>' + escapeHtml(weekdayLong(day)) + '</strong><span>' + escapeHtml(formatDateShort(day)) + '</span></div>';
      }).join("") + '</div>';

    var timeAxis = '<div class="time-axis">' + range(START_HOUR, END_HOUR).map(function (hour) {
      return "<span>" + pad(hour) + ":00</span>";
    }).join("") + '</div>';

    var columns = days.map(function (day) {
      var events = filteredEventsForDate(day);
      return '<div class="day-timeline" data-date="' + dateKey(day) + '">' + renderPositionedEvents(events) + '</div>';
    }).join("");

    el.calendarRoot.innerHTML = '<div class="agenda" style="--day-count:' + days.length + ';--hour-count:' + (END_HOUR - START_HOUR) + '">' + header + '<div class="agenda-body" style="--day-count:' + days.length + '">' + timeAxis + columns + '</div></div>';
  }

  function renderPositionedEvents(events) {
    if (!events.length) {
      return "";
    }

    var lanes = assignLanes(events);

    return events.map(function (event) {
      var start = new Date(event.start);
      var startMinute = minutesOfDay(start);
      var clippedStart = clamp(startMinute, START_HOUR * 60, END_HOUR * 60);
      var clippedEnd = clamp(startMinute + event.duration, START_HOUR * 60, END_HOUR * 60);
      var top = ((clippedStart - START_HOUR * 60) / TOTAL_MINUTES) * 100;
      var height = Math.max(((clippedEnd - clippedStart) / TOTAL_MINUTES) * 100, 4.2);
      var layout = lanes[event.id] || { lane: 0, laneCount: 1 };
      var width = 100 / layout.laneCount;
      var left = layout.lane * width;

      return '<button type="button" class="event-card" data-event-id="' + event.id + '" style="--top:' + top + '%;--height:' + height + '%;--left:' + left + '%;--width:' + width + '%;--event-color:' + eventColor(event) + '">' +
        '<strong>' + escapeHtml(eventTitle(event)) + '</strong>' +
        '<span>' + escapeHtml(formatTime(start)) + ' - ' + escapeHtml(roomName(event.roomId)) + '</span>' +
        '<span>' + eventResourceIds(event).length + ' risorse</span>' +
        '</button>';
    }).join("");
  }

  function assignLanes(events) {
    var sorted = events.slice().sort(function (a, b) {
      return new Date(a.start).getTime() - new Date(b.start).getTime();
    });
    var laneEnds = [];
    var byId = {};

    sorted.forEach(function (event) {
      var start = minutesOfDay(new Date(event.start));
      var end = start + event.duration;
      var lane = 0;

      while (laneEnds[lane] && laneEnds[lane] > start) {
        lane += 1;
      }

      laneEnds[lane] = end;
      byId[event.id] = { lane: lane, laneCount: 1 };
    });

    var count = Math.max(laneEnds.length, 1);
    Object.keys(byId).forEach(function (id) {
      byId[id].laneCount = count;
    });

    return byId;
  }

  function renderMonthView() {
    var first = startOfMonth(state.cursor);
    var start = startOfWeek(first);
    var days = rangeDays(start, 42);
    var weekdays = rangeDays(startOfWeek(new Date()), 7).map(function (day) {
      return '<div class="weekday">' + escapeHtml(weekdayShort(day)) + '</div>';
    }).join("");

    var cells = days.map(function (day) {
      var dayEvents = filteredEventsForDate(day);
      var visibleEvents = dayEvents.slice(0, 3);
      var muted = day.getMonth() !== state.cursor.getMonth();
      var today = dateKey(day) === dateKey(new Date());

      return '<div class="month-day' + (muted ? " is-muted" : "") + (today ? " is-today" : "") + '" data-date="' + dateKey(day) + '">' +
        '<div class="day-number"><span>' + day.getDate() + '</span><span>' + dayEvents.length + '</span></div>' +
        visibleEvents.map(function (event) {
          return '<button type="button" class="month-event" data-event-id="' + event.id + '" style="--event-color:' + eventColor(event) + '">' +
            '<strong>' + escapeHtml(eventTitle(event)) + '</strong>' +
            '<span>' + escapeHtml(formatTime(new Date(event.start))) + ' - ' + escapeHtml(roomName(event.roomId)) + '</span>' +
            '</button>';
        }).join("") +
        (dayEvents.length > 3 ? '<div class="more-events">+' + (dayEvents.length - 3) + ' altri</div>' : "") +
        '</div>';
    }).join("");

    el.calendarRoot.innerHTML = '<div class="month-grid">' + weekdays + cells + '</div>';
  }

  function renderYearView() {
    var year = state.cursor.getFullYear();
    var months = range(0, 12).map(function (month) {
      var first = new Date(year, month, 1);
      var start = startOfWeek(first);
      var days = rangeDays(start, 42);
      var headings = ["L", "M", "M", "G", "V", "S", "D"].map(function (label) {
        return '<div class="mini-weekday">' + label + '</div>';
      }).join("");

      var cells = days.map(function (day) {
        var count = filteredEventsForDate(day).length;
        return '<button class="mini-day' + (day.getMonth() !== month ? " is-muted" : "") + (dateKey(day) === dateKey(new Date()) ? " is-today" : "") + '" type="button" data-date="' + dateKey(day) + '">' +
          day.getDate() + (count ? '<span class="mini-count">' + count + '</span>' : "") +
          '</button>';
      }).join("");

      return '<section class="mini-month"><h3>' + escapeHtml(monthName(first)) + '</h3><div class="mini-grid">' + headings + cells + '</div></section>';
    }).join("");

    el.calendarRoot.innerHTML = '<div class="year-grid">' + months + '</div>';
  }

  function renderShows() {
    var shows = state.shows.filter(showMatchesSearch);
    el.showList.innerHTML = shows.length ? shows.map(renderShowRow).join("") : '<div class="empty-state">Nessuno spettacolo registrato</div>';
  }

  function renderShowRow(show) {
    var scheduledCount = state.events.filter(function (event) {
      return event.showId === show.id;
    }).length;
    var resourceCount = Array.isArray(show.resourceIds) ? show.resourceIds.length : 0;

    return '<div class="resource-row show-row">' +
      '<div class="row-title"><strong>' + escapeHtml(show.name) + '</strong><span>' + resourceCount + ' risorse / ' + escapeHtml(formatEuro(show.cost)) + ' / ' + scheduledCount + ' date in calendario</span></div>' +
      '<div class="row-actions">' +
      '<button class="button button-primary" type="button" data-schedule-show="' + show.id + '">Programma</button>' +
      '<button class="button button-muted button-icon" type="button" data-edit-show="' + show.id + '" aria-label="Modifica" title="Modifica">' +
        '<svg class="edit-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
          '<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.04c.39-.39.39-1.02 0-1.41l-2.51-2.51a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 2-1.66z"></path>' +
        '</svg>' +
      '</button>' +
      '<button class="button button-danger button-icon" type="button" data-delete-show="' + show.id + '" aria-label="Elimina" title="Elimina">' +
        '<svg class="trash-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
          '<path d="M9 3h6l1 2h5v2H3V5h5l1-2zm1 6h2v9h-2V9zm4 0h2v9h-2V9zM6 9h12l-1 12H7L6 9z"></path>' +
        '</svg>' +
      '</button>' +
      '</div>' +
      '</div>';
  }

  function renderResources() {
    var resources = state.resources.filter(resourceMatchesSearch).filter(resourceMatchesFilters);
    var groups = state.resourceGroupMode === "category" ? resourcesGroupedByCategory(resources) : resourcesGroupedByType(resources);

    document.querySelectorAll("[data-resource-group]").forEach(function (button) {
      button.classList.toggle("is-active", button.getAttribute("data-resource-group") === state.resourceGroupMode);
    });

    el.resourceFilterType.value = state.resourceTypeFilter;
    el.resourceFilterCategory.value = state.resourceCategoryFilter;

    if (!resources.length) {
      el.resourceList.innerHTML = '<div class="empty-state">Nessuna risorsa</div>';
      return;
    }

    el.resourceList.innerHTML = groups.map(renderResourceGroup).join("");
  }

  function resourcesGroupedByType(resources) {
    return RESOURCE_GROUPS.map(function (group) {
      var rows = resources.filter(function (resource) {
        return resource.type === group.type;
      });

      return {
        label: group.label,
        count: rows.length,
        rows: sortResourceRows(rows)
      };
    }).filter(function (group) {
      return group.count > 0;
    });
  }

  function resourcesGroupedByCategory(resources) {
    return RESOURCE_CATEGORIES.map(function (category) {
      var rows = resources.filter(function (resource) {
        return resource.category === category.id;
      });

      return {
        label: category.label,
        count: rows.length,
        rows: sortResourceRows(rows)
      };
    }).filter(function (group) {
      return group.count > 0;
    });
  }

  function sortResourceRows(resources) {
    return resources.slice().sort(function (a, b) {
      return resourceTypeIndex(a.type) - resourceTypeIndex(b.type) ||
        resourceCategoryIndex(a.category) - resourceCategoryIndex(b.category) ||
        a.name.localeCompare(b.name, "it");
    });
  }

  function renderResourceGroup(group) {
    return '<section class="resource-group">' +
      '<div class="group-title"><span>' + escapeHtml(group.label) + '</span><span>' + group.count + '</span></div>' +
      '<div class="resource-group-rows">' + group.rows.map(renderResourceRow).join("") + '</div>' +
      '</section>';
  }

  function renderResourceRow(resource) {
    var engagementCount = resourceEngagements(resource.id).length;
    var unavailableCount = targetUnavailability("resource", resource.id).length;
    return '<div class="resource-row">' +
      '<div class="row-title"><strong>' + escapeHtml(resource.name) + '</strong><span>' + escapeHtml(groupLabel(resource.type)) + ' / ' + escapeHtml(categoryLabel(resource.category)) + ' / ' + engagementCount + ' impegni / ' + unavailableCount + ' Non disponibile</span></div>' +
      '<div class="row-actions">' +
      '<button class="button button-primary" type="button" data-view-resource-schedule="' + resource.id + '">Impegni</button>' +
      '<button class="button button-muted" type="button" data-resource-unavailability="' + resource.id + '">Non disponibile</button>' +
      '<button class="button button-muted button-icon" type="button" data-edit-resource="' + resource.id + '" aria-label="Modifica" title="Modifica">' +
        '<svg class="edit-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
          '<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.04c.39-.39.39-1.02 0-1.41l-2.51-2.51a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 2-1.66z"></path>' +
        '</svg>' +
      '</button>' +      
      '<button class="button button-danger button-icon" type="button" data-delete-resource="' + resource.id + '" aria-label="Elimina" title="Elimina">' +
        '<svg class="trash-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
          '<path d="M9 3h6l1 2h5v2H3V5h5l1-2zm1 6h2v9h-2V9zm4 0h2v9h-2V9zM6 9h12l-1 12H7L6 9z"></path>' +
        '</svg>' +
        '</button>' +
      '</div>' +
      '</div>';
  }

  function renderRooms() {
    var rooms = state.rooms.filter(function (room) {
      return !state.search || room.name.toLowerCase().indexOf(state.search) !== -1;
    });

    el.roomList.innerHTML = rooms.length ? rooms.map(function (room) {
      var engagementCount = roomEngagements(room.id).length;
      var unavailableCount = targetUnavailability("room", room.id).length;
      return '<div class="room-row">' +
        '<div class="row-title"><strong>' + escapeHtml(room.name) + '</strong><span>' + (room.capacity ? room.capacity + " posti" : "Capienza non indicata") + ' / ' + engagementCount + ' impegni / ' + unavailableCount + ' Non disponibile</span></div>' +
        '<div class="row-actions">' +
        '<button class="button button-primary" type="button" data-view-room-schedule="' + room.id + '">Impegni</button>' +
        '<button class="button button-muted" type="button" data-room-unavailability="' + room.id + '">Non disponibile</button>' +
        '<button class="button button-muted button-icon" type="button" data-edit-room="' + room.id + '" aria-label="Modifica" title="Modifica">' +
          '<svg class="edit-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
            '<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.04c.39-.39.39-1.02 0-1.41l-2.51-2.51a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 2-1.66z"></path>' +
          '</svg>' +
        '</button>' +        
        '<button class="button button-danger button-icon" type="button" data-delete-room="' + room.id + '" aria-label="Elimina" title="Elimina">' +
          '<svg class="trash-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
            '<path d="M9 3h6l1 2h5v2H3V5h5l1-2zm1 6h2v9h-2V9zm4 0h2v9h-2V9zM6 9h12l-1 12H7L6 9z"></path>' +
          '</svg>' +
          '</button>' +        
        '</div>' +
        '</div>';
    }).join("") : '<div class="empty-state">Nessuna sala</div>';

    populateRoomOptions();
  }

  function renderArchive() {
    var conflicts = detectConflicts();
    el.conflictList.innerHTML = conflicts.length ? conflicts.map(function (conflict) {
      return '<div class="conflict-row"><strong>' + escapeHtml(conflict.title) + '</strong><span>' + escapeHtml(conflict.detail) + '</span></div>';
    }).join("") : '<div class="empty-state">Nessun conflitto</div>';

    var now = new Date();
    var upcoming = state.events.filter(function (event) {
      return new Date(event.start) >= now;
    }).slice(0, 8);

    el.upcomingList.innerHTML = upcoming.length ? upcoming.map(function (event) {
      return '<button type="button" class="upcoming-row" data-event-id="' + event.id + '">' +
        '<strong>' + escapeHtml(eventTitle(event)) + '</strong><span>' + escapeHtml(formatDateTime(new Date(event.start))) + ' - ' + escapeHtml(roomName(event.roomId)) + '</span>' +
        '</button>';
    }).join("") : '<div class="empty-state">Nessuno spettacolo programmato</div>';
  }

  function openEventModal(eventId, dateValue, showId) {
    if (!state.shows.length) {
      window.alert("Aggiungi un nuovo spettacolo");
      return;
    }

    var event = eventId ? findEvent(eventId) : null;
    var title = document.getElementById("eventModalTitle");
    var start = event ? new Date(event.start) : defaultEventDate(dateValue);
    var selectedShowId = event ? event.showId : (showId || (state.shows[0] ? state.shows[0].id : ""));

    el.eventForm.reset();
    el.eventFormError.textContent = "";
    populateShowOptions(selectedShowId);
    populateRoomOptions();
    renderEventDateInputs([start]);

    document.getElementById("eventId").value = event ? event.id : "";
    el.eventShow.value = selectedShowId;
    document.getElementById("eventRoom").value = event ? event.roomId : (state.rooms[0] ? state.rooms[0].id : "");

    title.textContent = event ? "Modifica calendario" : "Inserisci in calendario";
    showModal(el.eventModal);
  }

  function defaultEventDate(dateValue) {
    var base = dateValue ? parseDateKey(dateValue) : new Date(state.cursor.getTime());
    base.setHours(20, 30, 0, 0);
    return base;
  }

  async function handleEventSubmit(event) {
    event.preventDefault();
    el.eventFormError.textContent = "";

    var id = document.getElementById("eventId").value || uid("event");
    var existing = findEvent(id);
    var show = findShow(el.eventShow.value);
    var roomId = document.getElementById("eventRoom").value;
    var starts = Array.prototype.slice.call(el.eventDateList.querySelectorAll("[data-event-date]")).map(function (input) {
      return inputDateTimeLocal(input.value);
    });

    if (!show || !roomId || !starts.length || starts.some(function (start) {
      return isNaN(start.getTime());
    })) {
      el.eventFormError.textContent = "Scegli spettacolo, data con orario e sala.";
      return;
    }

    var candidates = starts.map(function (start, index) {
      var candidateExisting = index === 0 ? existing : null;

      return {
        id: index === 0 ? id : uid("event"),
        showId: show.id,
        title: show.name,
        roomId: roomId,
        start: start.toISOString(),
        duration: candidateExisting ? candidateExisting.duration : 120,
        color: show.color,

        // Ogni data in calendario conserva una propria copia delle risorse.
        // Se sto modificando una data già esistente, mantengo le sue risorse.
        // Se sto creando una nuova data, parto dalle risorse predefinite dello spettacolo.
        resourceIds: candidateExisting && Array.isArray(candidateExisting.resourceIds)
          ? candidateExisting.resourceIds.slice()
          : show.resourceIds.slice(),

        notes: candidateExisting ? candidateExisting.notes || "" : ""
      };
    });

    for (var i = 0; i < candidates.length; i += 1) {
      var candidate = candidates[i];
      var ignoreId = i === 0 && existing ? existing.id : "";
      var roomConflict = findRoomConflict(candidate, ignoreId);
      if (roomConflict) {
        el.eventFormError.textContent = "Sala occupata da " + eventTitle(roomConflict) + " alle " + formatTime(new Date(roomConflict.start)) + ".";
        return;
      }

      var roomUnavailable = findRoomUnavailability(candidate);
      if (roomUnavailable) {
        el.eventFormError.textContent = "Sala non disponibile nel periodo selezionato.";
        return;
      }

      var resourceConflicts = findResourceConflicts(candidate, candidate.resourceIds, ignoreId);
      if (resourceConflicts.length) {
        el.eventFormError.textContent = "Alcune risorse dello spettacolo sono gia occupate nello stesso orario.";
        return;
      }

      var resourceUnavailable = findResourceUnavailabilityConflicts(candidate, candidate.resourceIds);
      if (resourceUnavailable.length) {
        el.eventFormError.textContent = "Alcune risorse dello spettacolo non sono disponibili nello stesso orario.";
        return;
      }

      for (var j = i + 1; j < candidates.length; j += 1) {
        if (eventsOverlap(candidate, candidates[j])) {
          el.eventFormError.textContent = "Due date inserite si sovrappongono.";
          return;
        }
      }
    }

    await Promise.all(candidates.map(upsertEvent));
    state.cursor = new Date(candidates[0].start);
    closeModals();
    renderAll();
  }

  async function upsertEvent(event) {
    state.events = state.events.filter(function (item) {
      return item.id !== event.id;
    });
    state.events.push(event);
    sortData();
    await state.storage.put("events", event);
  }

  function openEventDetail(eventId) {
    var event = findEvent(eventId);
    if (!event) {
      return;
    }

    var show = eventShow(event);
    var resources = eventResourceIds(event).map(findResource).filter(Boolean);
    var grouped = RESOURCE_GROUPS.map(function (group) {
      var items = resources.filter(function (resource) {
        return resource.type === group.type;
      });
      if (!items.length) {
        return "";
      }
      return '<div class="detail-section"><h4>' + escapeHtml(group.label) + '</h4><div class="tag-list">' +
        items.map(function (resource) {
          return '<span class="tag">' + escapeHtml(resource.name) + '</span>';
        }).join("") + '</div></div>';
    }).join("");

    el.eventDetailBody.innerHTML =
      '<div class="detail-header">' +
      '<p class="eyebrow">Spettacolo</p>' +
      '<h3 id="eventDetailTitle">' + escapeHtml(eventTitle(event)) + '</h3>' +
      '<div class="detail-meta">' +
      '<span class="tag">' + escapeHtml(formatDateTime(new Date(event.start))) + '</span>' +
      '<span class="tag">' + event.duration + ' min</span>' +
      '<span class="tag">' + escapeHtml(roomName(event.roomId)) + '</span>' +
      (show ? '<span class="tag">' + escapeHtml(formatEuro(show.cost)) + '</span>' : '') +
      '</div>' +
      '</div>' +
      '<div class="detail-section"><h4>Descrizione</h4><p>' + escapeHtml(eventDescription(event) || "Nessuna descrizione") + '</p></div>' +
      (grouped || '<div class="detail-section"><h4>Risorse</h4><p>Nessuna risorsa assegnata</p></div>') +
      '<div class="detail-actions">' +
      '<button class="button button-primary" type="button" data-detail-action="assign" data-event-id="' + event.id + '">Gestisci risorse</button>' +
      '<button class="button button-muted button-icon" type="button" data-detail-action="edit" data-event-id="' + event.id + '" aria-label="Modifica" title="Modifica">' +
        '<svg class="edit-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
          '<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.04c.39-.39.39-1.02 0-1.41l-2.51-2.51a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 2-1.66z"></path>' +
        '</svg>' +
      '</button>' +
      '<button class="button button-danger button-icon" type="button" data-detail-action="delete" data-event-id="' + event.id + '" aria-label="Elimina" title="Elimina">' +
        '<svg class="trash-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
          '<path d="M9 3h6l1 2h5v2H3V5h5l1-2zm1 6h2v9h-2V9zm4 0h2v9h-2V9zM6 9h12l-1 12H7L6 9z"></path>' +
        '</svg>' +
        '</button>' +      
      '</div>';

    showModal(el.eventDetailModal);
  }

  async function handleEventDetailClick(event) {
    var button = event.target.closest("[data-detail-action]");
    if (!button) {
      return;
    }

    var eventId = button.getAttribute("data-event-id");
    var action = button.getAttribute("data-detail-action");

    if (action === "edit") {
      closeModals();
      openEventModal(eventId);
    } else if (action === "assign") {
      closeModals();
      openAssignmentModal(eventId);
    } else if (action === "delete") {
      if (window.confirm("Eliminare questo spettacolo?")) {
        await deleteEvent(eventId);
        closeModals();
        renderAll();
      }
    }
  }

  async function deleteEvent(eventId) {
    state.events = state.events.filter(function (event) {
      return event.id !== eventId;
    });
    await state.storage.delete("events", eventId);
  }

  function openAssignmentModal(eventId) {
    var event = findEvent(eventId);
    if (!event) {
      return;
    }

    state.assignmentEventId = eventId;
    el.assignmentError.textContent = "";
    document.getElementById("assignmentTitle").textContent = "Risorse per questa data";

    el.assignmentSummary.innerHTML =
      '<strong>' + escapeHtml(eventTitle(event)) + '</strong>' +
      '<span> ' + escapeHtml(formatDateTime(new Date(event.start))) +
      ' - ' + escapeHtml(roomName(event.roomId)) + '</span>';
    renderAssignmentGrid(event);
    showModal(el.assignmentModal);
  }

  function renderAssignmentGrid(event) {
    var html = "";

    RESOURCE_GROUPS.forEach(function (group) {
      group.categories.forEach(function (category) {
        var resources = state.resources.filter(function (resource) {
          return resource.type === group.type && resource.category === category.id;
        });

        html += '<section class="assignment-group"><h4>' + escapeHtml(category.label) + '</h4>';
        html += resources.length ? resources.map(function (resource) {
          var assigned = eventResourceIds(event).indexOf(resource.id) !== -1;
          var conflict = resourceConflictForEvent(resource.id, event.id);
          var unavailable = resourceUnavailableForEvent(resource.id, event.id);
          var disabled = (conflict || unavailable) && !assigned;
          var note = category.label;

          if (conflict) {
            note = "Occupata: " + conflict.title + " (" + formatTime(new Date(conflict.start)) + ")";
          } else if (unavailable) {
            note = "Non disponibile: " + formatDateTime(new Date(unavailable.start)) + " - " + formatDateTime(new Date(unavailable.end));
          }

          return '<label class="resource-option' + (conflict || unavailable ? " is-unavailable" : "") + '">' +
            '<input type="checkbox" name="resourceIds" value="' + resource.id + '"' + (assigned ? " checked" : "") + (disabled ? " disabled" : "") + '>' +
            '<span>' + escapeHtml(resource.name) + '<small>' + escapeHtml(note) + ' / ' + escapeHtml(formatEuro(resource.cost)) + '</small></span>' +
            '</label>';
        }).join("") : '<div class="empty-state">Nessuna risorsa</div>';
        html += '</section>';
      });
    });

    el.assignmentGrid.innerHTML = html;
  }

  async function handleAssignmentSubmit(event) {
    event.preventDefault();
    el.assignmentError.textContent = "";

    var scheduledEvent = findEvent(state.assignmentEventId);
    if (!scheduledEvent) {
      return;
    }

    var selected = Array.prototype.slice.call(
      el.assignmentGrid.querySelectorAll('input[name="resourceIds"]:checked')
    ).map(function (input) {
      return input.value;
    });

    var conflicts = findResourceConflicts(scheduledEvent, selected, scheduledEvent.id);
    if (conflicts.length) {
      el.assignmentError.textContent = "Una o piu risorse selezionate sono gia occupate nello stesso orario.";
      return;
    }

    var unavailable = findResourceUnavailabilityConflicts(scheduledEvent, selected);
    if (unavailable.length) {
      el.assignmentError.textContent = "Una o piu risorse selezionate non sono disponibili nello stesso orario.";
      return;
    }

    // Salvo le risorse solo su questa specifica data in calendario.
    scheduledEvent.resourceIds = selected;

    await upsertEvent(scheduledEvent);
    closeModals();
    renderAll();
    openEventDetail(scheduledEvent.id);
  }

  async function handleShowSubmit(event) {
    event.preventDefault();

    var id = document.getElementById("showId").value || uid("show");
    var existing = findShow(id);
    var name = document.getElementById("showName").value.trim();
    var selected = Array.prototype.slice.call(el.showResourceGrid.querySelectorAll('input[name="showResourceIds"]:checked')).map(function (input) {
      return input.value;
    });

    if (!name) {
      return;
    }

    var show = {
      id: id,
      name: name,
      description: document.getElementById("showDescription").value.trim(),
      resourceIds: selected,
      cost: Number(document.getElementById("showCost").value) || 0,
      color: existing ? existing.color : defaultEventColor(name)
    };

    state.shows = state.shows.filter(function (item) {
      return item.id !== show.id;
    });
    state.shows.push(show);
    state.events.forEach(function (scheduled) {
      if (scheduled.showId === show.id) {
        scheduled.title = show.name;
        scheduled.color = show.color;

        // Non sovrascrivo le risorse delle date già inserite in calendario,
        // perché ogni data può avere risorse diverse.
        // Solo se una vecchia data non ha ancora resourceIds, le inizializzo.
        if (!Array.isArray(scheduled.resourceIds)) {
          scheduled.resourceIds = show.resourceIds.slice();
        }
      }
    });
    sortData();
    await state.storage.put("shows", show);
    await Promise.all(state.events.filter(function (scheduled) {
      return scheduled.showId === show.id;
    }).map(function (scheduled) {
      return state.storage.put("events", scheduled);
    }));
    resetShowForm();
    setShowFormVisible(false);
    renderAll();
  }

  function handleShowListClick(event) {
    var scheduleButton = event.target.closest("[data-schedule-show]");
    var editButton = event.target.closest("[data-edit-show]");
    var deleteButton = event.target.closest("[data-delete-show]");

    if (scheduleButton) {
      openEventModal(null, null, scheduleButton.getAttribute("data-schedule-show"));
    } else if (editButton) {
      editShow(editButton.getAttribute("data-edit-show"));
    } else if (deleteButton) {
      deleteShow(deleteButton.getAttribute("data-delete-show"));
    }
  }

  function editShow(showId) {
    var show = findShow(showId);
    if (!show) {
      return;
    }

    setShowFormVisible(true);
    document.getElementById("showId").value = show.id;
    document.getElementById("showName").value = show.name;
    document.getElementById("showDescription").value = show.description || "";
    document.getElementById("showCost").value = show.cost || "";
    renderShowResourceGrid(show.resourceIds);
    document.getElementById("showName").focus();
  }

  async function deleteShow(showId) {
    var used = state.events.some(function (event) {
      return event.showId === showId;
    });

    if (used) {
      window.alert("Lo spettacolo e inserito in calendario. Elimina prima le date collegate.");
      return;
    }

    if (!window.confirm("Eliminare questo spettacolo?")) {
      return;
    }

    state.shows = state.shows.filter(function (show) {
      return show.id !== showId;
    });
    await state.storage.delete("shows", showId);
    resetShowForm();
    setShowFormVisible(false);
    renderAll();
  }

  async function handleResourceSubmit(event) {
    event.preventDefault();

    var id = document.getElementById("resourceId").value || uid("res");
    var resource = {
      id: id,
      type: el.resourceType.value,
      category: el.resourceCategory.value,
      name: document.getElementById("resourceName").value.trim(),
      notes: document.getElementById("resourceNotes").value.trim(),
      cost: el.resourceCost ? Number(el.resourceCost.value) || 0 : 0
    };

    if (!resource.name) {
      return;
    }

    state.resources = state.resources.filter(function (item) {
      return item.id !== resource.id;
    });
    state.resources.push(resource);
    sortData();
    await state.storage.put("resources", resource);
    resetResourceForm();
    setResourceFormVisible(false);
    renderAll();
  }

  async function handleRoomSubmit(event) {
    event.preventDefault();

    var id = document.getElementById("roomId").value || uid("room");
    var room = {
      id: id,
      name: document.getElementById("roomName").value.trim(),
      capacity: Number(document.getElementById("roomCapacity").value) || 0
    };

    if (!room.name) {
      return;
    }

    state.rooms = state.rooms.filter(function (item) {
      return item.id !== room.id;
    });
    state.rooms.push(room);
    sortData();
    await state.storage.put("rooms", room);
    resetRoomForm();
    setRoomFormVisible(false);
    renderAll();
  }

  function handleResourceListClick(event) {
    var scheduleButton = event.target.closest("[data-view-resource-schedule]");
    var unavailabilityButton = event.target.closest("[data-resource-unavailability]");
    var editButton = event.target.closest("[data-edit-resource]");
    var deleteButton = event.target.closest("[data-delete-resource]");

    if (scheduleButton) {
      openResourceSchedule(scheduleButton.getAttribute("data-view-resource-schedule"));
    } else if (unavailabilityButton) {
      openUnavailabilityModal("resource", unavailabilityButton.getAttribute("data-resource-unavailability"));
    } else if (editButton) {
      editResource(editButton.getAttribute("data-edit-resource"));
    } else if (deleteButton) {
      deleteResource(deleteButton.getAttribute("data-delete-resource"));
    }
  }

  function openResourceSchedule(resourceId) {
    var resource = findResource(resourceId);
    if (!resource) {
      return;
    }

    var engagements = resourceEngagements(resourceId);
    var nextEngagement = engagements.filter(function (event) {
      return new Date(event.start).getTime() + event.duration * 60000 >= Date.now();
    })[0] || null;

    el.resourceScheduleBody.innerHTML =
      '<div class="detail-header">' +
      '<p class="eyebrow">Impegni risorsa</p>' +
      '<h3 id="resourceScheduleTitle">' + escapeHtml(resource.name) + '</h3>' +
      '<div class="detail-meta">' +
      '<span class="tag">' + escapeHtml(groupLabel(resource.type)) + '</span>' +
      '<span class="tag">' + escapeHtml(categoryLabel(resource.category)) + '</span>' +
      '<span class="tag">' + engagements.length + ' spettacoli</span>' +
      (nextEngagement ? '<span class="tag">Prossimo: ' + escapeHtml(formatDateTime(new Date(nextEngagement.start))) + '</span>' : '') +
      '</div>' +
      '</div>' +
      '<div class="detail-section">' +
      '<h4>Spettacoli collegati</h4>' +
      (engagements.length ? '<div class="engagement-list">' + engagements.map(renderEngagementRow).join("") + '</div>' : '<p>Questa risorsa non e ancora assegnata ad alcuno spettacolo.</p>') +
      '</div>' +
      '<div class="detail-actions">' +
      '<button class="button button-muted" type="button" data-close-modal>Chiudi</button>' +
      '</div>';

    showModal(el.resourceScheduleModal);
  }

  function renderEngagementRow(event) {
    return '<button type="button" class="engagement-row" data-event-id="' + event.id + '" style="--event-color:' + eventColor(event) + '">' +
      '<span><strong>' + escapeHtml(formatDateTime(new Date(event.start))) + '</strong><span>' + escapeHtml(formatTimeRange(event)) + ' / ' + event.duration + ' min</span></span>' +
      '<span><strong>' + escapeHtml(eventTitle(event)) + '</strong><span>' + escapeHtml(roomName(event.roomId)) + '</span></span>' +
      '<span class="tag">' + escapeHtml(eventStatusLabel(event)) + '</span>' +
      '</button>';
  }

  function resourceEngagements(resourceId) {
    return state.events.filter(function (event) {
      return eventResourceIds(event).indexOf(resourceId) !== -1;
    }).sort(function (a, b) {
      return new Date(a.start).getTime() - new Date(b.start).getTime();
    });
  }

  function openUnavailabilityModal(targetType, targetId) {
    var targetName = unavailabilityTargetName(targetType, targetId);
    if (!targetName) {
      return;
    }

    document.getElementById("unavailabilityTargetType").value = targetType;
    document.getElementById("unavailabilityTargetId").value = targetId;
    document.getElementById("unavailabilityTitle").textContent = "Non disponibile: " + targetName;
    resetUnavailabilityForm();
    renderUnavailabilityList();
    showModal(el.unavailabilityModal);
  }

  function resetUnavailabilityForm() {
    var targetType = document.getElementById("unavailabilityTargetType").value;
    var targetId = document.getElementById("unavailabilityTargetId").value;
    var start = nextQuarterHour(new Date());
    var end = new Date(start.getTime() + 60 * 60000);

    document.getElementById("unavailabilityId").value = "";
    document.getElementById("unavailabilityTargetType").value = targetType;
    document.getElementById("unavailabilityTargetId").value = targetId;
    document.getElementById("unavailabilityStartDate").value = dateKey(start);
    document.getElementById("unavailabilityStartTime").value = timeInputValue(start);
    document.getElementById("unavailabilityEndDate").value = dateKey(end);
    document.getElementById("unavailabilityEndTime").value = timeInputValue(end);
    document.getElementById("unavailabilityReason").value = "";
    el.unavailabilityError.textContent = "";
  }

  async function handleUnavailabilitySubmit(event) {
    event.preventDefault();
    el.unavailabilityError.textContent = "";

    var targetType = document.getElementById("unavailabilityTargetType").value;
    var targetId = document.getElementById("unavailabilityTargetId").value;
    var start = inputDateTime(document.getElementById("unavailabilityStartDate").value, document.getElementById("unavailabilityStartTime").value);
    var end = inputDateTime(document.getElementById("unavailabilityEndDate").value, document.getElementById("unavailabilityEndTime").value);
    var period = {
      id: document.getElementById("unavailabilityId").value || uid("unavailable"),
      targetType: targetType,
      targetId: targetId,
      start: start.toISOString(),
      end: end.toISOString(),
      reason: document.getElementById("unavailabilityReason").value.trim()
    };

    if (!targetType || !targetId || isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      el.unavailabilityError.textContent = "Inserisci data e ora di inizio e fine valide.";
      return;
    }

    var overlap = targetUnavailability(targetType, targetId).filter(function (item) {
      return item.id !== period.id && periodsOverlap(period, item);
    })[0];

    if (overlap) {
      el.unavailabilityError.textContent = "Esiste gia un periodo di indisponibilita sovrapposto.";
      return;
    }

    state.unavailability = state.unavailability.filter(function (item) {
      return item.id !== period.id;
    });
    state.unavailability.push(period);
    sortUnavailability();
    await state.storage.put("unavailability", period);
    resetUnavailabilityForm();
    renderUnavailabilityList();
    renderAll();
  }

  function renderUnavailabilityList() {
    var targetType = document.getElementById("unavailabilityTargetType").value;
    var targetId = document.getElementById("unavailabilityTargetId").value;
    var periods = targetUnavailability(targetType, targetId);

    el.unavailabilityList.innerHTML = periods.length ? periods.map(renderUnavailabilityRow).join("") : '<div class="empty-state">Nessun periodo registrato</div>';
  }

  function renderUnavailabilityRow(period) {
    return '<div class="unavailability-row">' +
      '<div class="row-title"><strong>' + escapeHtml(formatPeriodRange(period)) + '</strong><span>' + escapeHtml(period.reason || "Motivo non indicato") + '</span></div>' +
      '<span class="tag tag-warning">' + escapeHtml(periodStatusLabel(period)) + '</span>' +
      '<div class="row-actions">' +
      '<button class="button button-muted button-icon" type="button" data-edit-unavailability="' + period.id + '" aria-label="Modifica" title="Modifica">' +
        '<svg class="edit-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
          '<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.04c.39-.39.39-1.02 0-1.41l-2.51-2.51a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 2-1.66z"></path>' +
        '</svg>' +
      '</button>' +      
      '<button class="button button-danger button-icon" type="button" data-delete-unavailability="' + period.id + '" aria-label="Elimina" title="Elimina">' +
        '<svg class="trash-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
          '<path d="M9 3h6l1 2h5v2H3V5h5l1-2zm1 6h2v9h-2V9zm4 0h2v9h-2V9zM6 9h12l-1 12H7L6 9z"></path>' +
        '</svg>' +
      '</button>' +      
      '</div>' +
      '</div>';
  }

  async function handleUnavailabilityListClick(event) {
    var editButton = event.target.closest("[data-edit-unavailability]");
    var deleteButton = event.target.closest("[data-delete-unavailability]");

    if (editButton) {
      editUnavailability(editButton.getAttribute("data-edit-unavailability"));
    } else if (deleteButton) {
      await deleteUnavailability(deleteButton.getAttribute("data-delete-unavailability"));
    }
  }

  function editUnavailability(periodId) {
    var period = findUnavailability(periodId);
    if (!period) {
      return;
    }

    var start = new Date(period.start);
    var end = new Date(period.end);
    document.getElementById("unavailabilityId").value = period.id;
    document.getElementById("unavailabilityStartDate").value = dateKey(start);
    document.getElementById("unavailabilityStartTime").value = timeInputValue(start);
    document.getElementById("unavailabilityEndDate").value = dateKey(end);
    document.getElementById("unavailabilityEndTime").value = timeInputValue(end);
    document.getElementById("unavailabilityReason").value = period.reason || "";
    el.unavailabilityError.textContent = "";
  }

  async function deleteUnavailability(periodId) {
    if (!window.confirm("Eliminare questo periodo di non disponibilità?")) {
      return;
    }

    state.unavailability = state.unavailability.filter(function (period) {
      return period.id !== periodId;
    });
    await state.storage.delete("unavailability", periodId);
    renderUnavailabilityList();
    renderAll();
  }

  function editResource(resourceId) {
    var resource = findResource(resourceId);
    if (!resource) {
      return;
    }

    setResourceFormVisible(true);
    document.getElementById("resourceId").value = resource.id;
    el.resourceType.value = resource.type;
    updateCategoryOptions();
    el.resourceCategory.value = resource.category;
    document.getElementById("resourceName").value = resource.name;
    document.getElementById("resourceNotes").value = resource.notes;
    if (el.resourceCost) {
      el.resourceCost.value = resource.cost || "";
    }
    document.getElementById("resourceName").focus();
  }

  async function deleteResource(resourceId) {
    if (!window.confirm("Eliminare questa risorsa? Sara rimossa dagli spettacoli esistenti.")) {
      return;
    }

    state.resources = state.resources.filter(function (resource) {
      return resource.id !== resourceId;
    });
    var periods = targetUnavailability("resource", resourceId);
    state.unavailability = state.unavailability.filter(function (period) {
      return !(period.targetType === "resource" && period.targetId === resourceId);
    });

    var affected = state.events.filter(function (event) {
      return event.resourceIds.indexOf(resourceId) !== -1;
    });
    affected.forEach(function (event) {
      event.resourceIds = event.resourceIds.filter(function (id) {
        return id !== resourceId;
      });
    });
    var affectedShows = state.shows.filter(function (show) {
      return show.resourceIds.indexOf(resourceId) !== -1;
    });
    affectedShows.forEach(function (show) {
      show.resourceIds = show.resourceIds.filter(function (id) {
        return id !== resourceId;
      });
    });

    await state.storage.delete("resources", resourceId);
    await Promise.all(periods.map(function (period) {
      return state.storage.delete("unavailability", period.id);
    }));
    await Promise.all(affected.map(function (event) {
      return state.storage.put("events", event);
    }));
    await Promise.all(affectedShows.map(function (show) {
      return state.storage.put("shows", show);
    }));

    resetResourceForm();
    setResourceFormVisible(false);
    renderAll();
  }

  function handleRoomListClick(event) {
    var scheduleButton = event.target.closest("[data-view-room-schedule]");
    var unavailabilityButton = event.target.closest("[data-room-unavailability]");
    var editButton = event.target.closest("[data-edit-room]");
    var deleteButton = event.target.closest("[data-delete-room]");

    if (scheduleButton) {
      openRoomSchedule(scheduleButton.getAttribute("data-view-room-schedule"));
    } else if (unavailabilityButton) {
      openUnavailabilityModal("room", unavailabilityButton.getAttribute("data-room-unavailability"));
    } else if (editButton) {
      editRoom(editButton.getAttribute("data-edit-room"));
    } else if (deleteButton) {
      deleteRoom(deleteButton.getAttribute("data-delete-room"));
    }
  }

  function openRoomSchedule(roomId) {
    var room = findRoom(roomId);
    if (!room) {
      return;
    }

    var engagements = roomEngagements(roomId);
    var nextEngagement = engagements.filter(function (event) {
      return eventEndDate(event).getTime() >= Date.now();
    })[0] || null;

    el.resourceScheduleBody.innerHTML =
      '<div class="detail-header">' +
      '<p class="eyebrow">Impegni sala</p>' +
      '<h3 id="resourceScheduleTitle">' + escapeHtml(room.name) + '</h3>' +
      '<div class="detail-meta">' +
      '<span class="tag">' + escapeHtml(room.capacity ? room.capacity + " posti" : "Capienza non indicata") + '</span>' +
      '<span class="tag">' + engagements.length + ' spettacoli</span>' +
      (nextEngagement ? '<span class="tag">Prossimo: ' + escapeHtml(formatDateTime(new Date(nextEngagement.start))) + '</span>' : '') +
      '</div>' +
      '</div>' +
      '<div class="detail-section">' +
      '<h4>Spettacoli ospitati</h4>' +
      (engagements.length ? '<div class="engagement-list">' + engagements.map(renderRoomEngagementRow).join("") + '</div>' : '<p>Questa sala non ospita ancora alcuno spettacolo.</p>') +
      '</div>' +
      '<div class="detail-actions">' +
      '<button class="button button-muted" type="button" data-close-modal>Chiudi</button>' +
      '</div>';

    showModal(el.resourceScheduleModal);
  }

  function renderRoomEngagementRow(event) {
    return '<button type="button" class="engagement-row" data-event-id="' + event.id + '" style="--event-color:' + eventColor(event) + '">' +
      '<span><strong>' + escapeHtml(formatDateTime(new Date(event.start))) + '</strong><span>' + escapeHtml(formatTimeRange(event)) + ' / ' + event.duration + ' min</span></span>' +
      '<span><strong>' + escapeHtml(eventTitle(event)) + '</strong><span>' + eventResourceIds(event).length + ' risorse assegnate</span></span>' +
      '<span class="tag">' + escapeHtml(eventStatusLabel(event)) + '</span>' +
      '</button>';
  }

  function roomEngagements(roomId) {
    return state.events.filter(function (event) {
      return event.roomId === roomId;
    }).sort(function (a, b) {
      return new Date(a.start).getTime() - new Date(b.start).getTime();
    });
  }

  function editRoom(roomId) {
    var room = findRoom(roomId);
    if (!room) {
      return;
    }

    setRoomFormVisible(true);
    document.getElementById("roomId").value = room.id;
    document.getElementById("roomName").value = room.name;
    document.getElementById("roomCapacity").value = room.capacity || "";
    document.getElementById("roomName").focus();
  }

  async function deleteRoom(roomId) {
    var used = state.events.some(function (event) {
      return event.roomId === roomId;
    });

    if (used) {
      window.alert("La sala e usata in uno o piu spettacoli. Modifica prima gli spettacoli collegati.");
      return;
    }

    if (!window.confirm("Eliminare questa sala?")) {
      return;
    }

    state.rooms = state.rooms.filter(function (room) {
      return room.id !== roomId;
    });
    var periods = targetUnavailability("room", roomId);
    state.unavailability = state.unavailability.filter(function (period) {
      return !(period.targetType === "room" && period.targetId === roomId);
    });
    await state.storage.delete("rooms", roomId);
    await Promise.all(periods.map(function (period) {
      return state.storage.delete("unavailability", period.id);
    }));
    resetRoomForm();
    setRoomFormVisible(false);
    renderAll();
  }

  function resetResourceForm() {
    el.resourceForm.reset();
    document.getElementById("resourceId").value = "";
    if (el.resourceCost) {
      el.resourceCost.value = "";
    }
    updateCategoryOptions();
  }

  function resetShowForm() {
    el.showForm.reset();
    document.getElementById("showId").value = "";
    renderShowResourceGrid([]);
  }

  function openNewShowForm() {
    resetShowForm();
    setShowFormVisible(true);
    document.getElementById("showName").focus();
  }

  function setShowFormVisible(visible) {
    el.showForm.classList.toggle("hidden", !visible);
    el.addShowButton.setAttribute("aria-expanded", visible ? "true" : "false");
  }

  function renderShowResourceGrid(selectedIds) {
    var selected = selectedIds || [];
    var html = "";

    RESOURCE_GROUPS.forEach(function (group) {
      var resources = state.resources.filter(function (resource) {
        return resource.type === group.type;
      });
      if (!resources.length) {
        return;
      }

      html += '<section class="assignment-group"><h4>' + escapeHtml(group.label) + '</h4>';
      html += sortResourceRows(resources).map(function (resource) {
        return '<label class="resource-option">' +
          '<input type="checkbox" name="showResourceIds" value="' + resource.id + '"' + (selected.indexOf(resource.id) !== -1 ? " checked" : "") + '>' +
          '<span>' + escapeHtml(resource.name) + '<small>' + escapeHtml(categoryLabel(resource.category)) + '</small></span>' +
          '</label>';
      }).join("");
      html += '</section>';
    });

    el.showResourceGrid.innerHTML = html || '<div class="empty-state">Nessuna risorsa disponibile</div>';
  }

  function openNewResourceForm() {
    resetResourceForm();
    setResourceFormVisible(true);
    document.getElementById("resourceName").focus();
  }

  function setResourceFormVisible(visible) {
    el.resourceForm.classList.toggle("hidden", !visible);
    el.resetResourceForm.setAttribute("aria-expanded", visible ? "true" : "false");
  }

  function resetRoomForm() {
    el.roomForm.reset();
    document.getElementById("roomId").value = "";
  }

  function openNewRoomForm() {
    resetRoomForm();
    setRoomFormVisible(true);
    document.getElementById("roomName").focus();
  }

  function setRoomFormVisible(visible) {
    el.roomForm.classList.toggle("hidden", !visible);
    el.resetRoomForm.setAttribute("aria-expanded", visible ? "true" : "false");
  }

  function populateResourceFilterOptions() {
    el.resourceFilterType.innerHTML = '<option value="">Tutti i tipi</option>' + RESOURCE_GROUPS.map(function (group) {
      return '<option value="' + group.type + '">' + escapeHtml(group.label) + '</option>';
    }).join("");

    el.resourceFilterCategory.innerHTML = '<option value="">Tutte le categorie</option>' + RESOURCE_CATEGORIES.map(function (category) {
      return '<option value="' + category.id + '">' + escapeHtml(category.label) + '</option>';
    }).join("");
  }

  function updateCategoryOptions() {
    var type = el.resourceType.value || "person";
    var group = RESOURCE_GROUPS.filter(function (item) {
      return item.type === type;
    })[0] || RESOURCE_GROUPS[0];

    el.resourceCategory.innerHTML = group.categories.map(function (category) {
      return '<option value="' + category.id + '">' + escapeHtml(category.label) + '</option>';
    }).join("");
  }

  function populateShowOptions(selectedShowId) {
    el.eventShow.innerHTML = state.shows.map(function (show) {
      return '<option value="' + show.id + '">' + escapeHtml(show.name) + '</option>';
    }).join("");
    if (selectedShowId) {
      el.eventShow.value = selectedShowId;
    }
  }

  function renderEventDateInputs(dates) {
    el.eventDateList.innerHTML = "";
    dates.forEach(function (date) {
      addEventDateInput(date);
    });
  }

  function addEventDateInput(date) {
    var row = document.createElement("span");
    row.className = "event-date-row";
    row.innerHTML =
      '<input type="datetime-local" data-event-date required>' +
      '<button class="button button-muted button-icon" type="button" data-remove-event-date aria-label="Rimuovi data" title="Rimuovi data">&times;</button>';
    row.querySelector("[data-event-date]").value = date ? dateTimeInputValue(date) : dateTimeInputValue(nextQuarterHour(new Date()));
    el.eventDateList.appendChild(row);
  }

  function populateRoomOptions() {
    var roomSelect = document.getElementById("eventRoom");
    if (!roomSelect) {
      return;
    }
    roomSelect.innerHTML = state.rooms.map(function (room) {
      return '<option value="' + room.id + '">' + escapeHtml(room.name) + (room.capacity ? " (" + room.capacity + ")" : "") + '</option>';
    }).join("");
  }

  function detectConflicts() {
    var conflicts = [];

    state.events.forEach(function (event, index) {
      var roomUnavailable = findRoomUnavailability(event);
      if (roomUnavailable) {
        conflicts.push({
          title: "Sala non disponibile: " + roomName(event.roomId),
          detail: eventTitle(event) + " / " + formatPeriodRange(roomUnavailable)
        });
      }

      findResourceUnavailabilityConflicts(event, eventResourceIds(event)).forEach(function (period) {
        var resource = findResource(period.targetId);
        conflicts.push({
          title: "Risorsa non disponibile: " + (resource ? resource.name : period.targetId),
          detail: eventTitle(event) + " / " + formatPeriodRange(period)
        });
      });

      state.events.slice(index + 1).forEach(function (other) {
        if (!eventsOverlap(event, other)) {
          return;
        }

        if (event.roomId && event.roomId === other.roomId) {
          conflicts.push({
            title: "Sala: " + roomName(event.roomId),
            detail: eventTitle(event) + " / " + eventTitle(other) + " - " + formatDateTime(new Date(event.start))
          });
        }

        var shared = eventResourceIds(event).filter(function (id) {
          return eventResourceIds(other).indexOf(id) !== -1;
        });

        shared.forEach(function (resourceId) {
          var resource = findResource(resourceId);
          conflicts.push({
            title: "Risorsa: " + (resource ? resource.name : resourceId),
            detail: eventTitle(event) + " / " + eventTitle(other) + " - " + formatDateTime(new Date(event.start))
          });
        });
      });
    });

    return conflicts;
  }

  function findRoomConflict(candidate, ignoreId) {
    return state.events.filter(function (event) {
      return event.id !== ignoreId && event.roomId === candidate.roomId && eventsOverlap(candidate, event);
    })[0] || null;
  }

  function findRoomUnavailability(candidate) {
    return targetUnavailability("room", candidate.roomId).filter(function (period) {
      return periodOverlapsEvent(period, candidate);
    })[0] || null;
  }

  function findResourceConflicts(candidate, resourceIds, ignoreId) {
    if (!resourceIds.length) {
      return [];
    }

    return state.events.filter(function (event) {
      if (event.id === ignoreId || !eventsOverlap(candidate, event)) {
        return false;
      }

      return eventResourceIds(event).some(function (resourceId) {
        return resourceIds.indexOf(resourceId) !== -1;
      });
    });
  }

  function resourceConflictForEvent(resourceId, eventId) {
    var event = findEvent(eventId);
    if (!event) {
      return null;
    }

    return state.events.filter(function (candidate) {
      return candidate.id !== event.id && eventResourceIds(candidate).indexOf(resourceId) !== -1 && eventsOverlap(event, candidate);
    })[0] || null;
  }

  function resourceUnavailableForEvent(resourceId, eventId) {
    var event = findEvent(eventId);
    if (!event) {
      return null;
    }

    return targetUnavailability("resource", resourceId).filter(function (period) {
      return periodOverlapsEvent(period, event);
    })[0] || null;
  }

  function findResourceUnavailabilityConflicts(candidate, resourceIds) {
    if (!resourceIds.length) {
      return [];
    }

    return state.unavailability.filter(function (period) {
      return period.targetType === "resource" && resourceIds.indexOf(period.targetId) !== -1 && periodOverlapsEvent(period, candidate);
    });
  }

  function eventsOverlap(a, b) {
    var aStart = new Date(a.start).getTime();
    var bStart = new Date(b.start).getTime();
    var aEnd = aStart + Number(a.duration) * 60000;
    var bEnd = bStart + Number(b.duration) * 60000;
    return rangesOverlap(aStart, aEnd, bStart, bEnd);
  }

  function periodOverlapsEvent(period, event) {
    var eventStart = new Date(event.start).getTime();
    var eventEnd = eventStart + Number(event.duration) * 60000;
    return rangesOverlap(new Date(period.start).getTime(), new Date(period.end).getTime(), eventStart, eventEnd);
  }

  function periodsOverlap(a, b) {
    return rangesOverlap(new Date(a.start).getTime(), new Date(a.end).getTime(), new Date(b.start).getTime(), new Date(b.end).getTime());
  }

  function rangesOverlap(aStart, aEnd, bStart, bEnd) {
    return aStart < bEnd && bStart < aEnd;
  }

  function exportData() {
    var data = {
      version: 3,
      exportedAt: new Date().toISOString(),
      shows: state.shows,
      events: state.events,
      resources: state.resources,
      rooms: state.rooms,
      unavailability: state.unavailability
    };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "theater-manager-backup.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 400);
  }

  function importData(event) {
    var file = event.target.files[0];
    if (!file) {
      return;
    }

    var reader = new FileReader();
    reader.onload = async function () {
      try {
        var data = JSON.parse(String(reader.result || "{}"));
        if (!Array.isArray(data.events) || !Array.isArray(data.resources) || !Array.isArray(data.rooms)) {
          throw new Error("Formato non valido");
        }
        if (!window.confirm("Importare questo archivio? I dati locali saranno sostituiti.")) {
          return;
        }

        state.shows = Array.isArray(data.shows) ? data.shows.map(normalizeShow) : [];
        state.events = data.events.map(normalizeEvent);
        state.resources = data.resources.map(normalizeResource);
        state.rooms = data.rooms.map(normalizeRoom);
        state.unavailability = Array.isArray(data.unavailability) ? data.unavailability.map(normalizeUnavailability).filter(Boolean) : [];
        ensureEventShows();
        sortData();

        await Promise.all(STORES.map(function (store) {
          return state.storage.clear(store);
        }));
        await Promise.all(state.events.map(function (row) {
          return state.storage.put("events", row);
        }));
        await Promise.all(state.shows.map(function (row) {
          return state.storage.put("shows", row);
        }));
        await Promise.all(state.resources.map(function (row) {
          return state.storage.put("resources", row);
        }));
        await Promise.all(state.rooms.map(function (row) {
          return state.storage.put("rooms", row);
        }));
        await Promise.all(state.unavailability.map(function (row) {
          return state.storage.put("unavailability", row);
        }));

        renderAll();
      } catch (error) {
        window.alert("Impossibile importare il file JSON.");
      } finally {
        el.importDataInput.value = "";
      }
    };
    reader.readAsText(file);
  }

  function movePeriod(direction) {
    var cursor = new Date(state.cursor.getTime());
    if (state.view === "day") {
      cursor.setDate(cursor.getDate() + direction);
    } else if (state.view === "week") {
      cursor.setDate(cursor.getDate() + direction * 7);
    } else if (state.view === "month") {
      cursor.setMonth(cursor.getMonth() + direction);
    } else {
      cursor.setFullYear(cursor.getFullYear() + direction);
    }
    state.cursor = cursor;
    renderCalendar();
  }

  function periodLabel() {
    if (state.view === "day") {
      return formatDateLong(state.cursor);
    }
    if (state.view === "week") {
      var start = startOfWeek(state.cursor);
      var end = addDays(start, 6);
      return formatDateShort(start) + " - " + formatDateShort(end);
    }
    if (state.view === "month") {
      return monthName(state.cursor) + " " + state.cursor.getFullYear();
    }
    return String(state.cursor.getFullYear());
  }

  function filteredEventsForDate(day) {
    return eventsForDate(day).filter(eventMatchesSearch);
  }

  function eventsForDate(day) {
    var key = dateKey(day);
    return state.events.filter(function (event) {
      return dateKey(new Date(event.start)) === key;
    });
  }

  function eventMatchesSearch(event) {
    if (!state.search) {
      return true;
    }

    var show = findShow(event.showId);
    var resourceNames = eventResourceIds(event).map(function (id) {
      var resource = findResource(id);
      return resource ? resource.name : "";
    }).join(" ");

    var haystack = [
      eventTitle(event),
      roomName(event.roomId),
      show ? show.description : event.notes,
      resourceNames
    ].join(" ").toLowerCase();

    return haystack.indexOf(state.search) !== -1;
  }

  function showMatchesSearch(show) {
    if (!state.search) {
      return true;
    }

    var resourceNames = show.resourceIds.map(function (id) {
      var resource = findResource(id);
      return resource ? resource.name : "";
    }).join(" ");

    return [show.name, show.description, resourceNames, formatEuro(show.cost)].join(" ").toLowerCase().indexOf(state.search) !== -1;
  }

  function resourceMatchesSearch(resource) {
    if (!state.search) {
      return true;
    }

    return [
      resource.name,
      categoryLabel(resource.category),
      groupLabel(resource.type),
      resource.notes,
      formatEuro(resource.cost)
    ].join(" ").toLowerCase().indexOf(state.search) !== -1;
  }

  function resourceMatchesFilters(resource) {
    if (state.resourceTypeFilter && resource.type !== state.resourceTypeFilter) {
      return false;
    }
    if (state.resourceCategoryFilter && resource.category !== state.resourceCategoryFilter) {
      return false;
    }
    return true;
  }

  function findEvent(eventId) {
    return state.events.filter(function (event) {
      return event.id === eventId;
    })[0] || null;
  }

  function findShow(showId) {
    return state.shows.filter(function (show) {
      return show.id === showId;
    })[0] || null;
  }

  function findResource(resourceId) {
    return state.resources.filter(function (resource) {
      return resource.id === resourceId;
    })[0] || null;
  }

  function findRoom(roomId) {
    return state.rooms.filter(function (room) {
      return room.id === roomId;
    })[0] || null;
  }

  function findUnavailability(periodId) {
    return state.unavailability.filter(function (period) {
      return period.id === periodId;
    })[0] || null;
  }

  function targetUnavailability(targetType, targetId) {
    return state.unavailability.filter(function (period) {
      return period.targetType === targetType && period.targetId === targetId;
    }).sort(function (a, b) {
      return new Date(a.start).getTime() - new Date(b.start).getTime();
    });
  }

  function unavailabilityTargetName(targetType, targetId) {
    if (targetType === "room") {
      var room = findRoom(targetId);
      return room ? room.name : "";
    }

    var resource = findResource(targetId);
    return resource ? resource.name : "";
  }

  function roomName(roomId) {
    var room = findRoom(roomId);
    return room ? room.name : "Sala non trovata";
  }

  function eventShow(event) {
    return findShow(event.showId);
  }

  function eventTitle(event) {
    var show = eventShow(event);
    return show ? show.name : (event.title || "Spettacolo");
  }

  function eventDescription(event) {
    var show = eventShow(event);
    return show ? show.description : (event.notes || "");
  }

  function eventResourceIds(event) {
    if (event && Array.isArray(event.resourceIds)) {
      return event.resourceIds;
    }

    var show = eventShow(event);
    return show ? show.resourceIds : [];
  }

  function categoryLabel(categoryId) {
    var label = categoryId;
    RESOURCE_GROUPS.forEach(function (group) {
      group.categories.forEach(function (category) {
        if (category.id === categoryId) {
          label = category.label;
        }
      });
    });
    return label;
  }

  function validResourceCategory(type, categoryId) {
    var group = RESOURCE_GROUPS.filter(function (item) {
      return item.type === type;
    })[0];

    return Boolean(group && group.categories.some(function (category) {
      return category.id === categoryId;
    }));
  }

  function resourceTypeIndex(type) {
    for (var i = 0; i < RESOURCE_GROUPS.length; i += 1) {
      if (RESOURCE_GROUPS[i].type === type) {
        return i;
      }
    }
    return RESOURCE_GROUPS.length;
  }

  function resourceCategoryIndex(categoryId) {
    for (var i = 0; i < RESOURCE_CATEGORIES.length; i += 1) {
      if (RESOURCE_CATEGORIES[i].id === categoryId) {
        return i;
      }
    }
    return RESOURCE_CATEGORIES.length;
  }

  function groupLabel(type) {
    if (type === "material") {
      return "Materiali";
    }
    if (type === "expense") {
      return "Spese";
    }
    return "Persone";
  }

  function eventColor(event) {
    var show = event ? eventShow(event) : null;
    if (show && isHexColor(show.color)) {
      return show.color;
    }
    if (event && isHexColor(event.color)) {
      return event.color;
    }
    return defaultEventColor(event ? event.id || eventTitle(event) || event.roomId : "");
  }

  function nextEventColor() {
    var used = state.events.map(function (event) {
      return event.color;
    }).filter(isHexColor);

    for (var i = 0; i < COLORS.length; i += 1) {
      if (used.indexOf(COLORS[i]) === -1) {
        return COLORS[i];
      }
    }

    return generatedColor(state.events.length);
  }

  function defaultEventColor(seed) {
    var value = String(seed || "spettacolo");
    var hash = 0;
    for (var i = 0; i < value.length; i += 1) {
      hash = (hash + value.charCodeAt(i) * (i + 1)) % 360;
    }
    return generatedColor(hash);
  }

  function generatedColor(seed) {
    var hue = (Number(seed) * 137.508) % 360;
    return hslToHex(hue, 52, 38);
  }

  function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    var c = (1 - Math.abs(2 * l - 1)) * s;
    var x = c * (1 - Math.abs((h / 60) % 2 - 1));
    var m = l - c / 2;
    var r = 0;
    var g = 0;
    var b = 0;

    if (h < 60) {
      r = c;
      g = x;
    } else if (h < 120) {
      r = x;
      g = c;
    } else if (h < 180) {
      g = c;
      b = x;
    } else if (h < 240) {
      g = x;
      b = c;
    } else if (h < 300) {
      r = x;
      b = c;
    } else {
      r = c;
      b = x;
    }

    return "#" + [r, g, b].map(function (channel) {
      return Math.round((channel + m) * 255).toString(16).padStart(2, "0");
    }).join("");
  }

  function isHexColor(value) {
    return /^#[0-9a-f]{6}$/i.test(String(value || ""));
  }

  function showModal(modal) {
    modal.classList.remove("hidden");
    var firstInput = modal.querySelector("input, select, textarea, button");
    if (firstInput) {
      window.setTimeout(function () {
        firstInput.focus();
      }, 20);
    }
  }

  function closeModals() {
    document.querySelectorAll(".modal-layer").forEach(function (modal) {
      modal.classList.add("hidden");
    });
    state.assignmentEventId = null;
  }

  function uid(prefix) {
    return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function inputDateTime(dateValue, timeValue) {
    var dateParts = dateValue.split("-").map(Number);
    var timeParts = timeValue.split(":").map(Number);
    return new Date(dateParts[0], dateParts[1] - 1, dateParts[2], timeParts[0], timeParts[1] || 0, 0, 0);
  }

  function inputDateTimeLocal(value) {
    var parts = String(value || "").split("T");
    if (parts.length !== 2) {
      return new Date(NaN);
    }
    return inputDateTime(parts[0], parts[1]);
  }

  function parseDateKey(value) {
    var parts = value.split("-").map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
  }

  function dateKey(date) {
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
  }

  function timeInputValue(date) {
    return pad(date.getHours()) + ":" + pad(date.getMinutes());
  }

  function dateTimeInputValue(date) {
    return dateKey(date) + "T" + timeInputValue(date);
  }

  function nextQuarterHour(date) {
    var result = new Date(date.getTime());
    var minutes = result.getMinutes();
    var rounded = Math.ceil(minutes / 15) * 15;
    if (rounded === 60) {
      result.setHours(result.getHours() + 1, 0, 0, 0);
    } else {
      result.setMinutes(rounded, 0, 0);
    }
    return result;
  }

  function minutesOfDay(date) {
    return date.getHours() * 60 + date.getMinutes();
  }

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function startOfWeek(date) {
    var day = startOfDay(date);
    var weekDay = (day.getDay() + 6) % 7;
    day.setDate(day.getDate() - weekDay);
    return day;
  }

  function startOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  function addDays(date, days) {
    var result = new Date(date.getTime());
    result.setDate(result.getDate() + days);
    return result;
  }

  function rangeDays(start, count) {
    return range(0, count).map(function (offset) {
      return addDays(start, offset);
    });
  }

  function range(start, end) {
    var values = [];
    for (var i = start; i < end; i += 1) {
      values.push(i);
    }
    return values;
  }

  function unique(values) {
    return values.filter(function (value, index) {
      return values.indexOf(value) === index;
    });
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function weekdayLong(date) {
    return date.toLocaleDateString("it-IT", { weekday: "long" });
  }

  function weekdayShort(date) {
    return date.toLocaleDateString("it-IT", { weekday: "short" });
  }

  function monthName(date) {
    return date.toLocaleDateString("it-IT", { month: "long" }).replace(/^\w/, function (letter) {
      return letter.toUpperCase();
    });
  }

  function formatDateShort(date) {
    return date.toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
  }

  function formatDateLong(date) {
    return date.toLocaleDateString("it-IT", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  }

  function formatDateTime(date) {
    return date.toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" }) + " " + formatTime(date);
  }

  function formatTimeRange(event) {
    return formatTime(new Date(event.start)) + "-" + formatTime(eventEndDate(event));
  }

  function formatPeriodRange(period) {
    return formatDateTime(new Date(period.start)) + " - " + formatDateTime(new Date(period.end));
  }

  function formatTime(date) {
    return date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  }

  function formatEuro(value) {
    return (Number(value) || 0).toLocaleString("it-IT", { style: "currency", currency: "EUR" });
  }

  function eventEndDate(event) {
    return new Date(new Date(event.start).getTime() + Number(event.duration) * 60000);
  }

  function eventStatusLabel(event) {
    var now = Date.now();
    var start = new Date(event.start).getTime();
    var end = eventEndDate(event).getTime();
    if (now > end) {
      return "Concluso";
    }
    if (now >= start && now <= end) {
      return "In corso";
    }
    return "Programmato";
  }

  function periodStatusLabel(period) {
    var now = Date.now();
    var start = new Date(period.start).getTime();
    var end = new Date(period.end).getTime();
    if (now > end) {
      return "Passata";
    }
    if (now >= start && now <= end) {
      return "In corso";
    }
    return "Programmata";
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
