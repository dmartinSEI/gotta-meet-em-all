// Maps exact Microsoft Forms Excel column header text → JSONB key.
// Headers are normalized (lowercased + trimmed) before matching.
// If the survey is reworded, update the left side here — no DB migration needed.
export const SURVEY_FIELD_MAP: Record<string, string> = {
  "full name (first and last name)":                                                                                    "full_name",
  "please provide your sei email address.":                                                                             "email",
  "please provide your sei email address":                                                                              "email",
  "where did you grow up, and what's one thing you loved about it?":                                                    "hometown",
  "what's something from your (family, culture, community) that still influences you today?":                           "cultural_influence",
  "what languages do you speak or wish you spoke?":                                                                     "languages",
  "what does your spouse/partner enjoy doing?":                                                                         "partner_interests",
  "family: if you have kids, what do they enjoy doing?":                                                                "kids_interests",
  "do you have any pets?":                                                                                              "pets",
  "what hobbies or activities do you enjoy outside of work?":                                                           "hobbies",
  "how do you recharge after a long week?":                                                                             "recharge",
  "what's something new you've been wanting to try?":                                                                   "want_to_try",
  "are you interested in sports, fitness, or outdoor activities (briefly describe your interests)?":                    "sports_fitness",
  "what creative outlets do you enjoy (art, writing, music, crafting, etc.)?":                                          "creative_outlets",
  "what does your ideal saturday look like?":                                                                           "ideal_saturday",
  "what's a topic you could talk about for hours?":                                                                     "passion_topic",
  "what's the last book, show, movie, or podcast you really enjoyed, or a favorite genre?":                             "media",
  "what would your walk-up song be?":                                                                                   "walkup_song",
  "what's your favorite place you've ever visited and why?":                                                            "favorite_place",
  "are you more of a beach, city, or mountains person?":                                                                "travel_preference",
  "what's a dream destination you hope to visit someday?":                                                              "dream_destination",
  "what's a memorable experience you've had while traveling or exploring?":                                             "travel_memory",
  "what's your go-to comfort food?":                                                                                    "comfort_food",
  "are you a coffee person, tea person, or neither?":                                                                   "coffee_or_tea",
  "do you enjoy cooking or baking?":                                                                                    "cooking",
  "what's a food you could eat every day and never get tired of?":                                                      "never_tired_of_food",
  "what's your favorite quote?":                                                                                        "favorite_quote",
  "what's a fun fact about you that most people don't know?":                                                           "fun_fact",
  "if you could instantly master any skill (work or personal), what would it be?":                                      "dream_skill",
  "what's your favorite way to unwind after a long day?":                                                               "unwind",
  "what roles do you typically fill? (e.g., data, project management, agile, etc.)":                                   "roles",
  "what kind of work environment helps you thrive?":                                                                    "work_environment",
  "what motivates you at work?":                                                                                        "work_motivation",
  "what's a tool, framework, or method you swear by (agile, kanban, etc.)?":                                           "tools_frameworks",
  "what's a topic in tech or business you could nerd out about for hours?":                                            "tech_passion",
  "which client are you currently working with?":                                                                       "current_client",
  "what other clients have you worked with in the past?":                                                               "past_clients",
  "is there a non-profit or volunteer cause you're especially passionate about?":                                       "volunteering",
  "what shared interest would you love to find in a colleague?":                                                        "shared_interest_seeking",
  "how do you most enjoy connecting with others? (e.g., small group hangouts, activities or sports, family oriented, evenings vs. daytime)": "connection_style",
  "which pillars are you actively involved with right now?":                                                            "pillars",
  "do you prefer spending time in larger groups or smaller, more intimate gatherings?":                                 "group_preference",
  "which time frames and touch points are most convenient for you? (for example, virtual meetings may be preferable due to family obligations.)": "availability",
  "would you be interested in being connected with three other sei team members who have varying lengths of tenure at the company and share similar interests with you?": "opt_in_matching",
  "are you comfortable sharing your details for the cincinnati team roster?":                                           "roster_consent",
};

// These are the join key / metadata fields — stored during import but not rendered as profile content.
export const SKIP_KEYS = new Set(["full_name", "email"]);

// Microsoft Forms always prepends these system columns — ignore them.
export const SYSTEM_COLUMNS = new Set([
  "id", "start time", "completion time", "email", "name",
]);

export type SurveyData = {
  hometown?: string;
  cultural_influence?: string;
  languages?: string;
  partner_interests?: string;
  kids_interests?: string;
  pets?: string;
  hobbies?: string;
  recharge?: string;
  want_to_try?: string;
  sports_fitness?: string;
  creative_outlets?: string;
  ideal_saturday?: string;
  passion_topic?: string;
  media?: string;
  walkup_song?: string;
  favorite_place?: string;
  travel_preference?: string;
  dream_destination?: string;
  travel_memory?: string;
  comfort_food?: string;
  coffee_or_tea?: string;
  cooking?: string;
  never_tired_of_food?: string;
  favorite_quote?: string;
  fun_fact?: string;
  dream_skill?: string;
  unwind?: string;
  roles?: string;
  work_environment?: string;
  work_motivation?: string;
  tools_frameworks?: string;
  tech_passion?: string;
  current_client?: string;
  past_clients?: string;
  volunteering?: string;
  shared_interest_seeking?: string;
  connection_style?: string;
  pillars?: string;
  group_preference?: string;
  availability?: string;
  opt_in_matching?: string;
  roster_consent?: string;
};

// Dossier page section layout — drives the /consultant/[id] UI.
// Add a field here (matching a SurveyData key) to make it appear in the section.
export const DOSSIER_SECTIONS: {
  title: string;
  icon: string;
  fields: { key: keyof SurveyData; label: string; badge?: boolean }[];
}[] = [
  {
    title: "Background",
    icon: "🌍",
    fields: [
      { key: "hometown",           label: "Where they grew up" },
      { key: "languages",          label: "Languages" },
      { key: "cultural_influence", label: "Cultural influence" },
    ],
  },
  {
    title: "Life Outside Work",
    icon: "🏡",
    fields: [
      { key: "hobbies",          label: "Hobbies" },
      { key: "sports_fitness",   label: "Sports & fitness" },
      { key: "creative_outlets", label: "Creative outlets" },
      { key: "ideal_saturday",   label: "Ideal Saturday" },
      { key: "recharge",         label: "How they recharge" },
      { key: "want_to_try",      label: "Wants to try" },
      { key: "pets",             label: "Pets" },
      { key: "partner_interests",label: "Partner's interests" },
      { key: "kids_interests",   label: "Kids' interests" },
    ],
  },
  {
    title: "Entertainment & Culture",
    icon: "🎭",
    fields: [
      { key: "passion_topic", label: "Topic they could talk about for hours" },
      { key: "media",         label: "Favorite media" },
      { key: "walkup_song",   label: "Walk-up song 🎵" },
      { key: "tech_passion",  label: "Tech / business nerd topic" },
    ],
  },
  {
    title: "Travel",
    icon: "✈️",
    fields: [
      { key: "travel_preference",  label: "Prefers",               badge: true },
      { key: "favorite_place",     label: "Favorite place visited" },
      { key: "dream_destination",  label: "Dream destination" },
      { key: "travel_memory",      label: "Memorable travel experience" },
    ],
  },
  {
    title: "Food & Drink",
    icon: "🍕",
    fields: [
      { key: "coffee_or_tea",       label: "Coffee or tea?",         badge: true },
      { key: "comfort_food",        label: "Comfort food" },
      { key: "cooking",             label: "Cooking & baking" },
      { key: "never_tired_of_food", label: "Could eat every day" },
    ],
  },
  {
    title: "Just For Fun",
    icon: "🎯",
    fields: [
      { key: "fun_fact",       label: "Fun fact" },
      { key: "favorite_quote", label: "Favorite quote" },
      { key: "dream_skill",    label: "Dream skill to master" },
      { key: "unwind",         label: "Unwinds by" },
    ],
  },
  {
    title: "At Work",
    icon: "💼",
    fields: [
      { key: "roles",             label: "Roles" },
      { key: "work_environment",  label: "Thrives in" },
      { key: "work_motivation",   label: "Motivated by" },
      { key: "tools_frameworks",  label: "Go-to tools & frameworks" },
      { key: "current_client",    label: "Current client" },
      { key: "past_clients",      label: "Past clients" },
    ],
  },
  {
    title: "Community",
    icon: "🤝",
    fields: [
      { key: "volunteering",            label: "Volunteer cause" },
      { key: "shared_interest_seeking", label: "Shared interest they look for" },
      { key: "connection_style",        label: "Connects best by" },
      { key: "group_preference",        label: "Group preference",              badge: true },
      { key: "pillars",                 label: "Active pillars" },
      { key: "availability",            label: "Best times to connect" },
    ],
  },
];
