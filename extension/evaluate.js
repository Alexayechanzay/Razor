(function (root) {
  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[—–]/g, "-")
      .replace(/\s+/g, " ")
      .trim();
  }

  var FIXTURES = [
    {
      title: "The Most Misunderstood Concept in Physics",
      evaluation: {
        status: "aligned",
        confidence: 0.78,
        reason:
          "This reads as a conceptual physics explainer. It never names momentum or impulse, so a topic-keyword check would miss it. It still matches a student trying to understand physics ideas.",
        suggestedAction: "continue",
        classifier: "demo-fixture",
      },
    },
    {
      title: "This changed everything",
      evaluation: {
        status: "uncertain",
        confidence: 0.36,
        reason:
          "The title has no subject. From the page name alone, there is not enough context to say this matches or leaves the study intention.",
        suggestedAction: "review",
        classifier: "demo-fixture",
      },
    },
    {
      title: "I Failed Physics, Then Became a UFC Fighter",
      evaluation: {
        status: "drifting",
        confidence: 0.84,
        reason:
          "The title contains “Physics,” but the story is a fighting career, not a lesson. A keyword matcher that sees Physics would call this aligned. Purpose-aware comparison does not.",
        suggestedAction: "return_to_goal",
        classifier: "demo-fixture",
      },
    },
  ];

  var OFF_TOPIC =
    /\b(chess|gaming|gamer|gameplay|minecraft|fortnite|roblox|valorant|football|soccer|nba|nfl|cricket|tennis|anime|manga|makeup|skincare|cooking|recipe|vlog|unboxing|prank|reaction|music|song|official video|trailer|podcast|asmr|comedy|tiktok|ufc|mma|highlights|celebrity|movie|netflix|series)\b/i;
  var STUDY_TOPIC =
    /\b(momentum|impulse|igcse|newton|collision|kinematics|inertia|conservation of momentum|resultant force|a-?level|as-?level|gcse|particle|quantum|lepton|hadron|mechanics|electricity|waves|magnetism|thermodynamics)\b/i;

  function intentionTokens(intention) {
    var text = normalize(intention);
    var generic = [
      "physics",
      "maths",
      "math",
      "chemistry",
      "biology",
      "history",
      "english",
      "science",
      "revise",
      "revision",
    ];
    var specificHints = [
      "momentum",
      "impulse",
      "igcse",
      "newton",
      "collision",
      "kinematics",
      "algebra",
      "calculus",
      "organic",
      "stoichiometry",
      "a-level",
      "a level",
      "gcse",
    ];
    return {
      generic: generic.filter(function (token) {
        return text.indexOf(token) !== -1;
      }),
      specific: specificHints.filter(function (token) {
        return text.indexOf(token) !== -1;
      }),
    };
  }

  function isVague(title) {
    var words = normalize(title).split(" ").filter(Boolean);
    if (words.length <= 4 && !OFF_TOPIC.test(title) && !STUDY_TOPIC.test(title)) {
      return true;
    }
    return /^(this|watch this|wait|wow|part \d+|ep\.? \d+|must watch)/i.test(title.trim());
  }

  function drifting(reason, confidence) {
    return {
      status: "drifting",
      confidence: confidence || 0.84,
      reason: reason,
      suggestedAction: "return_to_goal",
      classifier: "heuristic",
    };
  }

  function heuristic(intention, title) {
    var tokens = intentionTokens(intention);
    var titleNorm = normalize(title);
    var offTopic = OFF_TOPIC.test(title) || OFF_TOPIC.test(titleNorm);
    var hasSpecific =
      tokens.specific.some(function (token) {
        return titleNorm.indexOf(token) !== -1;
      }) || STUDY_TOPIC.test(title);
    var hasGeneric = tokens.generic.some(function (token) {
      return titleNorm.indexOf(token) !== -1;
    });

    if (offTopic && !hasSpecific) {
      return drifting(
        "This looks like a different activity than the study intention you started.",
      );
    }
    if (hasSpecific) {
      return {
        status: "aligned",
        confidence: 0.74,
        reason: "The title names a topic from the active intention.",
        suggestedAction: "continue",
        classifier: "heuristic",
      };
    }
    if (hasGeneric && !offTopic) {
      return {
        status: "uncertain",
        confidence: 0.48,
        reason:
          "The title shares a broad subject word with the intention, but not the specific topic. There is not enough context to be sure.",
        suggestedAction: "review",
        classifier: "heuristic",
      };
    }
    if (isVague(title)) {
      return {
        status: "uncertain",
        confidence: 0.36,
        reason: "The title is too thin to compare with the active intention.",
        suggestedAction: "review",
        classifier: "heuristic",
      };
    }
    return drifting("This page does not match the study intention you started.");
  }

  function evaluate(intention, context) {
    context = context || {};
    var title = (context.title || "").trim();
    if (!title) {
      return {
        status: "uncertain",
        confidence: 0.2,
        reason: "No page title was available to compare with the intention.",
        suggestedAction: "review",
        classifier: "heuristic",
      };
    }
    for (var i = 0; i < FIXTURES.length; i += 1) {
      if (normalize(FIXTURES[i].title) === normalize(title)) {
        return FIXTURES[i].evaluation;
      }
    }

    var searchQuery = (context.searchQuery || "").trim();
    if (
      searchQuery &&
      isSearchAllowed(intention, searchQuery) &&
      !OFF_TOPIC.test(title)
    ) {
      return {
        status: "aligned",
        confidence: 0.8,
        reason: "You opened this from a search that matches your intention.",
        suggestedAction: "continue",
        classifier: "heuristic",
      };
    }

    var haystack = [title, context.channel, context.playlist]
      .filter(Boolean)
      .join(" ");
    return heuristic(intention, haystack || title);
  }

  function searchQueryFor(intention) {
    return String(intention || "")
      .replace(/[—–]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function youtubeSearchUrl(intention) {
    return (
      "https://www.youtube.com/results?search_query=" +
      encodeURIComponent(searchQueryFor(intention))
    );
  }

  function isSearchAllowed(intention, query) {
    if (!query || !String(query).trim()) {
      return true;
    }
    return evaluate(intention, { title: query }).status !== "drifting";
  }

  root.RazorEvaluate = {
    evaluate: evaluate,
    searchQueryFor: searchQueryFor,
    youtubeSearchUrl: youtubeSearchUrl,
    isSearchAllowed: isSearchAllowed,
  };
})(globalThis);
