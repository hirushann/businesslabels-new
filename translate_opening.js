const fs = require('fs');

const path = './src/lib/i18n/messages.js';
let messages = fs.readFileSync(path, 'utf8');

const enOpeningStatus = `    openingStatus: {
      openedNow: "Opened now.",
      closedOpenAt: "Closed, we open {day} at {time}",
      today: "today",
      tomorrow: "tomorrow",
      monday: "Monday",
      tuesday: "Tuesday",
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
      sunday: "Sunday"
    },
`;

const nlOpeningStatus = `    openingStatus: {
      openedNow: "Nu geopend.",
      closedOpenAt: "Gesloten, we openen {day} om {time}",
      today: "vandaag",
      tomorrow: "morgen",
      monday: "maandag",
      tuesday: "dinsdag",
      wednesday: "woensdag",
      thursday: "donderdag",
      friday: "vrijdag",
      saturday: "zaterdag",
      sunday: "zondag"
    },
`;

const badgePageMatches = [...messages.matchAll(/    badgePage: \{/g)];
if (badgePageMatches.length >= 2) {
    const firstIndex = badgePageMatches[0].index;
    const secondIndex = badgePageMatches[1].index;
    
    messages = messages.substring(0, firstIndex) + enOpeningStatus + messages.substring(firstIndex, secondIndex) + nlOpeningStatus + messages.substring(secondIndex);
    fs.writeFileSync(path, messages);
    console.log('Successfully injected openingStatus translations!');
} else {
    console.log('Could not find badgePage');
}
