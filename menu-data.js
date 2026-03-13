const MENU_CATEGORIES = [
  {
    "id": "klassiek",
    "label": {
      "nl": "Klassiekers",
      "en": "Classics",
      "fr": "Classiques"
    }
  },
  {
    "id": "specials",
    "label": {
      "nl": "Specials",
      "en": "Specials",
      "fr": "Specialites"
    }
  },
  {
    "id": "salades",
    "label": {
      "nl": "Salades",
      "en": "Salads",
      "fr": "Salades"
    }
  },
  {
    "id": "warm",
    "label": {
      "nl": "Warme snacks",
      "en": "Hot snacks",
      "fr": "Snacks chauds"
    }
  },
  {
    "id": "supplementen",
    "label": {
      "nl": "Supplementen",
      "en": "Add-ons",
      "fr": "Supplements"
    }
  }
];

const MENU_ITEMS = [
  {
    "category": "klassiek",
    "name": {
      "nl": "Kaas",
      "en": "Kaas",
      "fr": "Kaas"
    },
    "description": {
      "nl": "Klassiek broodje.",
      "en": "Klassiek broodje.",
      "fr": "Klassiek broodje."
    },
    "price": "EUR 3,50"
  },
  {
    "category": "klassiek",
    "name": {
      "nl": "Oude Kaas",
      "en": "Oude Kaas",
      "fr": "Oude Kaas"
    },
    "description": {
      "nl": "Klassiek broodje.",
      "en": "Klassiek broodje.",
      "fr": "Klassiek broodje."
    },
    "price": "EUR 3,70"
  },
  {
    "category": "klassiek",
    "name": {
      "nl": "Hesp",
      "en": "Hesp",
      "fr": "Hesp"
    },
    "description": {
      "nl": "Klassiek broodje.",
      "en": "Klassiek broodje.",
      "fr": "Klassiek broodje."
    },
    "price": "EUR 3,50"
  },
  {
    "category": "klassiek",
    "name": {
      "nl": "Brie",
      "en": "Brie",
      "fr": "Brie"
    },
    "description": {
      "nl": "Klassiek broodje.",
      "en": "Klassiek broodje.",
      "fr": "Klassiek broodje."
    },
    "price": "EUR 4,00"
  },
  {
    "category": "klassiek",
    "name": {
      "nl": "Kruidenkaas",
      "en": "Kruidenkaas",
      "fr": "Kruidenkaas"
    },
    "description": {
      "nl": "Klassiek broodje.",
      "en": "Klassiek broodje.",
      "fr": "Klassiek broodje."
    },
    "price": "EUR 3,70"
  },
  {
    "category": "klassiek",
    "name": {
      "nl": "Geitenkaas",
      "en": "Geitenkaas",
      "fr": "Geitenkaas"
    },
    "description": {
      "nl": "Klassiek broodje.",
      "en": "Klassiek broodje.",
      "fr": "Klassiek broodje."
    },
    "price": "EUR 4,00"
  },
  {
    "category": "klassiek",
    "name": {
      "nl": "Kaas & Hesp",
      "en": "Kaas & Hesp",
      "fr": "Kaas & Hesp"
    },
    "description": {
      "nl": "Klassiek broodje.",
      "en": "Klassiek broodje.",
      "fr": "Klassiek broodje."
    },
    "price": "EUR 4,30"
  },
  {
    "category": "klassiek",
    "name": {
      "nl": "Oude Kaas & Hesp",
      "en": "Oude Kaas & Hesp",
      "fr": "Oude Kaas & Hesp"
    },
    "description": {
      "nl": "Klassiek broodje.",
      "en": "Klassiek broodje.",
      "fr": "Klassiek broodje."
    },
    "price": "EUR 4,50"
  },
  {
    "category": "klassiek",
    "name": {
      "nl": "Serrano Ham",
      "en": "Serrano Ham",
      "fr": "Serrano Ham"
    },
    "description": {
      "nl": "Klassiek broodje.",
      "en": "Klassiek broodje.",
      "fr": "Klassiek broodje."
    },
    "price": "EUR 4,20"
  },
  {
    "category": "klassiek",
    "name": {
      "nl": "Huisgemaakte Gebakken Kip",
      "en": "Huisgemaakte Gebakken Kip",
      "fr": "Huisgemaakte Gebakken Kip"
    },
    "description": {
      "nl": "Klassiek broodje.",
      "en": "Klassiek broodje.",
      "fr": "Klassiek broodje."
    },
    "price": "EUR 4,30"
  },
  {
    "category": "klassiek",
    "name": {
      "nl": "Boulette Koud",
      "en": "Boulette Koud",
      "fr": "Boulette Koud"
    },
    "description": {
      "nl": "met saus",
      "en": "met saus",
      "fr": "met saus"
    },
    "price": "EUR 5,00"
  },
  {
    "category": "klassiek",
    "name": {
      "nl": "Boulette Koud Special",
      "en": "Boulette Koud Special",
      "fr": "Boulette Koud Special"
    },
    "description": {
      "nl": "met saus en ui",
      "en": "met saus en ui",
      "fr": "met saus en ui"
    },
    "price": "EUR 5,60"
  },
  {
    "category": "klassiek",
    "name": {
      "nl": "Preparé",
      "en": "Preparé",
      "fr": "Preparé"
    },
    "description": {
      "nl": "Klassiek broodje.",
      "en": "Klassiek broodje.",
      "fr": "Klassiek broodje."
    },
    "price": "EUR 4,30"
  },
  {
    "category": "klassiek",
    "name": {
      "nl": "Martino",
      "en": "Martino",
      "fr": "Martino"
    },
    "description": {
      "nl": "preparé, ui, augurk, mosterd, ketchup, ansjovis, pikant",
      "en": "preparé, ui, augurk, mosterd, ketchup, ansjovis, pikant",
      "fr": "preparé, ui, augurk, mosterd, ketchup, ansjovis, pikant"
    },
    "price": "EUR 4,60"
  },
  {
    "category": "klassiek",
    "name": {
      "nl": "Kip Curry",
      "en": "Kip Curry",
      "fr": "Kip Curry"
    },
    "description": {
      "nl": "Status: niet voorradig",
      "en": "Status: niet voorradig",
      "fr": "Status: niet voorradig"
    },
    "price": "EUR 5,20"
  },
  {
    "category": "klassiek",
    "name": {
      "nl": "Huisgemaakte Kipsla",
      "en": "Huisgemaakte Kipsla",
      "fr": "Huisgemaakte Kipsla"
    },
    "description": {
      "nl": "Klassiek broodje.",
      "en": "Klassiek broodje.",
      "fr": "Klassiek broodje."
    },
    "price": "EUR 4,50"
  },
  {
    "category": "klassiek",
    "name": {
      "nl": "Tonijnsla",
      "en": "Tonijnsla",
      "fr": "Tonijnsla"
    },
    "description": {
      "nl": "Klassiek broodje.",
      "en": "Klassiek broodje.",
      "fr": "Klassiek broodje."
    },
    "price": "EUR 5,00"
  },
  {
    "category": "klassiek",
    "name": {
      "nl": "Pikante Tonijnsla",
      "en": "Pikante Tonijnsla",
      "fr": "Pikante Tonijnsla"
    },
    "description": {
      "nl": "Klassiek broodje.",
      "en": "Klassiek broodje.",
      "fr": "Klassiek broodje."
    },
    "price": "EUR 5,00"
  },
  {
    "category": "klassiek",
    "name": {
      "nl": "Tonijntino",
      "en": "Tonijntino",
      "fr": "Tonijntino"
    },
    "description": {
      "nl": "mosterd, ketchup, ui",
      "en": "mosterd, ketchup, ui",
      "fr": "mosterd, ketchup, ui"
    },
    "price": "EUR 5,50"
  },
  {
    "category": "klassiek",
    "name": {
      "nl": "Krabsla",
      "en": "Krabsla",
      "fr": "Krabsla"
    },
    "description": {
      "nl": "Klassiek broodje.",
      "en": "Klassiek broodje.",
      "fr": "Klassiek broodje."
    },
    "price": "EUR 4,40"
  },
  {
    "category": "klassiek",
    "name": {
      "nl": "Garnaalsla",
      "en": "Garnaalsla",
      "fr": "Garnaalsla"
    },
    "description": {
      "nl": "Klassiek broodje.",
      "en": "Klassiek broodje.",
      "fr": "Klassiek broodje."
    },
    "price": "EUR 5,00"
  },
  {
    "category": "klassiek",
    "name": {
      "nl": "Gerookte Zalm",
      "en": "Gerookte Zalm",
      "fr": "Gerookte Zalm"
    },
    "description": {
      "nl": "Klassiek broodje.",
      "en": "Klassiek broodje.",
      "fr": "Klassiek broodje."
    },
    "price": "EUR 5,00"
  },
  {
    "category": "klassiek",
    "name": {
      "nl": "Gerookte Zalm met Kruidenkaas",
      "en": "Gerookte Zalm met Kruidenkaas",
      "fr": "Gerookte Zalm met Kruidenkaas"
    },
    "description": {
      "nl": "Klassiek broodje.",
      "en": "Klassiek broodje.",
      "fr": "Klassiek broodje."
    },
    "price": "EUR 5,30"
  },
  {
    "category": "klassiek",
    "name": {
      "nl": "Gezond",
      "en": "Gezond",
      "fr": "Gezond"
    },
    "description": {
      "nl": "Klassiek broodje.",
      "en": "Klassiek broodje.",
      "fr": "Klassiek broodje."
    },
    "price": "EUR 4,00"
  },
  {
    "category": "klassiek",
    "name": {
      "nl": "Aardappelsla",
      "en": "Aardappelsla",
      "fr": "Aardappelsla"
    },
    "description": {
      "nl": "Klassiek broodje.",
      "en": "Klassiek broodje.",
      "fr": "Klassiek broodje."
    },
    "price": "EUR 3,40"
  },
  {
    "category": "specials",
    "name": {
      "nl": "Brie Deluxe",
      "en": "Brie Deluxe",
      "fr": "Brie Deluxe"
    },
    "description": {
      "nl": "Brie, spek, appel, honing en noten",
      "en": "Brie, spek, appel, honing en noten",
      "fr": "Brie, spek, appel, honing en noten"
    },
    "price": "EUR 5,50"
  },
  {
    "category": "specials",
    "name": {
      "nl": "Bloody Mary",
      "en": "Bloody Mary",
      "fr": "Bloody Mary"
    },
    "description": {
      "nl": "Martino, ansjovis, augurk, ei en cajunkruiden",
      "en": "Martino, ansjovis, augurk, ei en cajunkruiden",
      "fr": "Martino, ansjovis, augurk, ei en cajunkruiden"
    },
    "price": "EUR 4,70"
  },
  {
    "category": "specials",
    "name": {
      "nl": "Italiaantje",
      "en": "Italiaantje",
      "fr": "Italiaantje"
    },
    "description": {
      "nl": "Serranoham, pesto, rucola en mozzarella",
      "en": "Serranoham, pesto, rucola en mozzarella",
      "fr": "Serranoham, pesto, rucola en mozzarella"
    },
    "price": "EUR 5,60"
  },
  {
    "category": "specials",
    "name": {
      "nl": "Oh My Goat!",
      "en": "Oh My Goat!",
      "fr": "Oh My Goat!"
    },
    "description": {
      "nl": "Spek, honing, appel, geitenkaas en rucola",
      "en": "Spek, honing, appel, geitenkaas en rucola",
      "fr": "Spek, honing, appel, geitenkaas en rucola"
    },
    "price": "EUR 6,00"
  },
  {
    "category": "specials",
    "name": {
      "nl": "Mexicaantje",
      "en": "Mexicaantje",
      "fr": "Mexicaantje"
    },
    "description": {
      "nl": "Huisgemaakte kip, appel, cresson en ijsbergsla",
      "en": "Huisgemaakte kip, appel, cresson en ijsbergsla",
      "fr": "Huisgemaakte kip, appel, cresson en ijsbergsla"
    },
    "price": "EUR 5,90"
  },
  {
    "category": "specials",
    "name": {
      "nl": "Boereke",
      "en": "Boereke",
      "fr": "Boereke"
    },
    "description": {
      "nl": "Spek, komkommer, ei, tomaat, sla en BBQ-saus",
      "en": "Spek, komkommer, ei, tomaat, sla en BBQ-saus",
      "fr": "Spek, komkommer, ei, tomaat, sla en BBQ-saus"
    },
    "price": "EUR 6,00"
  },
  {
    "category": "specials",
    "name": {
      "nl": "Kruidje",
      "en": "Kruidje",
      "fr": "Kruidje"
    },
    "description": {
      "nl": "Zalm, kruidenkaas, ei en cresson",
      "en": "Zalm, kruidenkaas, ei en cresson",
      "fr": "Zalm, kruidenkaas, ei en cresson"
    },
    "price": "EUR 5,50"
  },
  {
    "category": "specials",
    "name": {
      "nl": "Pulled Pork BBQ",
      "en": "Pulled Pork BBQ",
      "fr": "Pulled Pork BBQ"
    },
    "description": {
      "nl": "Wortelen, ui en augurk",
      "en": "Wortelen, ui en augurk",
      "fr": "Wortelen, ui en augurk"
    },
    "price": "EUR 5,60"
  },
  {
    "category": "specials",
    "name": {
      "nl": "Kip Fiesta",
      "en": "Kip Fiesta",
      "fr": "Kip Fiesta"
    },
    "description": {
      "nl": "Gebakken kip, sla, feta en frisse dressing",
      "en": "Gebakken kip, sla, feta en frisse dressing",
      "fr": "Gebakken kip, sla, feta en frisse dressing"
    },
    "price": "EUR 5,80"
  },
  {
    "category": "specials",
    "name": {
      "nl": "Chicken Surprise",
      "en": "Chicken Surprise",
      "fr": "Chicken Surprise"
    },
    "description": {
      "nl": "Gebakken kip, tomaat, sla en currymayo",
      "en": "Gebakken kip, tomaat, sla en currymayo",
      "fr": "Gebakken kip, tomaat, sla en currymayo"
    },
    "price": "EUR 5,80"
  },
  {
    "category": "specials",
    "name": {
      "nl": "Bo",
      "en": "Bo",
      "fr": "Bo"
    },
    "description": {
      "nl": "Kip, tuinkers, sojascheuten en currymayo",
      "en": "Kip, tuinkers, sojascheuten en currymayo",
      "fr": "Kip, tuinkers, sojascheuten en currymayo"
    },
    "price": "EUR 5,40"
  },
  {
    "category": "specials",
    "name": {
      "nl": "Iveke",
      "en": "Iveke",
      "fr": "Iveke"
    },
    "description": {
      "nl": "Preparé, ei, ui, mayo en ketchup",
      "en": "Preparé, ei, ui, mayo en ketchup",
      "fr": "Preparé, ei, ui, mayo en ketchup"
    },
    "price": "EUR 5,50"
  },
  {
    "category": "specials",
    "name": {
      "nl": "Septembré",
      "en": "Septembré",
      "fr": "Septembré"
    },
    "description": {
      "nl": "Preparé, rucola, pesto, ei en mayo",
      "en": "Preparé, rucola, pesto, ei en mayo",
      "fr": "Preparé, rucola, pesto, ei en mayo"
    },
    "price": "EUR 5,00"
  },
  {
    "category": "specials",
    "name": {
      "nl": "Vani's Special",
      "en": "Vani's Special",
      "fr": "Vani's Special"
    },
    "description": {
      "nl": "Gebakken kip, spek, parmezaan, rucola en Caesar dressing",
      "en": "Gebakken kip, spek, parmezaan, rucola en Caesar dressing",
      "fr": "Gebakken kip, spek, parmezaan, rucola en Caesar dressing"
    },
    "price": "EUR 6,20"
  },
  {
    "category": "specials",
    "name": {
      "nl": "Sweet Chicken",
      "en": "Sweet Chicken",
      "fr": "Sweet Chicken"
    },
    "description": {
      "nl": "Kipsla, perzik en ijsbergsla",
      "en": "Kipsla, perzik en ijsbergsla",
      "fr": "Kipsla, perzik en ijsbergsla"
    },
    "price": "EUR 5,20"
  },
  {
    "category": "specials",
    "name": {
      "nl": "Fitness Delight",
      "en": "Fitness Delight",
      "fr": "Fitness Delight"
    },
    "description": {
      "nl": "Kipfilet, cottage cheese, komkommer en tuinkers op fitnessbroodje",
      "en": "Kipfilet, cottage cheese, komkommer en tuinkers op fitnessbroodje",
      "fr": "Kipfilet, cottage cheese, komkommer en tuinkers op fitnessbroodje"
    },
    "price": "EUR 6,50"
  },
  {
    "category": "specials",
    "name": {
      "nl": "Brie Honey",
      "en": "Brie Honey",
      "fr": "Brie Honey"
    },
    "description": {
      "nl": "Brie, honing, walnoten en rucola",
      "en": "Brie, honing, walnoten en rucola",
      "fr": "Brie, honing, walnoten en rucola"
    },
    "price": "EUR 5,50"
  },
  {
    "category": "salades",
    "name": {
      "nl": "Salade Natuur",
      "en": "Salade Natuur",
      "fr": "Salade Natuur"
    },
    "description": {
      "nl": "Verse salade.",
      "en": "Verse salade.",
      "fr": "Verse salade."
    },
    "price": "EUR 7,00"
  },
  {
    "category": "salades",
    "name": {
      "nl": "Salade met Hesp",
      "en": "Salade met Hesp",
      "fr": "Salade met Hesp"
    },
    "description": {
      "nl": "Verse salade.",
      "en": "Verse salade.",
      "fr": "Verse salade."
    },
    "price": "EUR 9,00"
  },
  {
    "category": "salades",
    "name": {
      "nl": "Salade met Gebakken Kip",
      "en": "Salade met Gebakken Kip",
      "fr": "Salade met Gebakken Kip"
    },
    "description": {
      "nl": "Verse salade.",
      "en": "Verse salade.",
      "fr": "Verse salade."
    },
    "price": "EUR 9,50"
  },
  {
    "category": "salades",
    "name": {
      "nl": "Salade Preparé",
      "en": "Salade Preparé",
      "fr": "Salade Preparé"
    },
    "description": {
      "nl": "Verse salade.",
      "en": "Verse salade.",
      "fr": "Verse salade."
    },
    "price": "EUR 9,00"
  },
  {
    "category": "salades",
    "name": {
      "nl": "Salade Geitenkaas",
      "en": "Salade Geitenkaas",
      "fr": "Salade Geitenkaas"
    },
    "description": {
      "nl": "met spekjes en appel",
      "en": "met spekjes en appel",
      "fr": "met spekjes en appel"
    },
    "price": "EUR 10,50"
  },
  {
    "category": "salades",
    "name": {
      "nl": "Salade Tonijnsla",
      "en": "Salade Tonijnsla",
      "fr": "Salade Tonijnsla"
    },
    "description": {
      "nl": "Verse salade.",
      "en": "Verse salade.",
      "fr": "Verse salade."
    },
    "price": "EUR 10,00"
  },
  {
    "category": "salades",
    "name": {
      "nl": "Salade Krabsla",
      "en": "Salade Krabsla",
      "fr": "Salade Krabsla"
    },
    "description": {
      "nl": "Verse salade.",
      "en": "Verse salade.",
      "fr": "Verse salade."
    },
    "price": "EUR 10,00"
  },
  {
    "category": "salades",
    "name": {
      "nl": "Salade Gerookte Zalm",
      "en": "Salade Gerookte Zalm",
      "fr": "Salade Gerookte Zalm"
    },
    "description": {
      "nl": "Verse salade.",
      "en": "Verse salade.",
      "fr": "Verse salade."
    },
    "price": "EUR 10,00"
  },
  {
    "category": "salades",
    "name": {
      "nl": "Salade Oceaan",
      "en": "Salade Oceaan",
      "fr": "Salade Oceaan"
    },
    "description": {
      "nl": "Zalm, Tonijnsla, Krab, Garnaal",
      "en": "Zalm, Tonijnsla, Krab, Garnaal",
      "fr": "Zalm, Tonijnsla, Krab, Garnaal"
    },
    "price": "EUR 13,00"
  },
  {
    "category": "salades",
    "name": {
      "nl": "Salade Griekje",
      "en": "Salade Griekje",
      "fr": "Salade Griekje"
    },
    "description": {
      "nl": "Verse salade.",
      "en": "Verse salade.",
      "fr": "Verse salade."
    },
    "price": "EUR 10,00"
  },
  {
    "category": "warm",
    "name": {
      "nl": "Hamburger (met broodje)",
      "en": "Hamburger (met broodje)",
      "fr": "Hamburger (met broodje)"
    },
    "description": {
      "nl": "Warme snack met broodje.",
      "en": "Warme snack met broodje.",
      "fr": "Warme snack met broodje."
    },
    "price": "EUR 4,00"
  },
  {
    "category": "warm",
    "name": {
      "nl": "Hamburger (zonder broodje)",
      "en": "Hamburger (zonder broodje)",
      "fr": "Hamburger (zonder broodje)"
    },
    "description": {
      "nl": "Warme snack zonder broodje.",
      "en": "Warme snack zonder broodje.",
      "fr": "Warme snack zonder broodje."
    },
    "price": "EUR 2,50"
  },
  {
    "category": "warm",
    "name": {
      "nl": "Cheeseburger (met broodje)",
      "en": "Cheeseburger (met broodje)",
      "fr": "Cheeseburger (met broodje)"
    },
    "description": {
      "nl": "Warme snack met broodje.",
      "en": "Warme snack met broodje.",
      "fr": "Warme snack met broodje."
    },
    "price": "EUR 4,30"
  },
  {
    "category": "warm",
    "name": {
      "nl": "Cheeseburger (zonder broodje)",
      "en": "Cheeseburger (zonder broodje)",
      "fr": "Cheeseburger (zonder broodje)"
    },
    "description": {
      "nl": "Warme snack zonder broodje.",
      "en": "Warme snack zonder broodje.",
      "fr": "Warme snack zonder broodje."
    },
    "price": "EUR 2,80"
  },
  {
    "category": "warm",
    "name": {
      "nl": "Bicky Burger",
      "en": "Bicky Burger",
      "fr": "Bicky Burger"
    },
    "description": {
      "nl": "Warme snack.",
      "en": "Warme snack.",
      "fr": "Warme snack."
    },
    "price": "EUR 5,10"
  },
  {
    "category": "warm",
    "name": {
      "nl": "Bicky Cheese",
      "en": "Bicky Cheese",
      "fr": "Bicky Cheese"
    },
    "description": {
      "nl": "Warme snack.",
      "en": "Warme snack.",
      "fr": "Warme snack."
    },
    "price": "EUR 5,40"
  },
  {
    "category": "warm",
    "name": {
      "nl": "Kippenburger",
      "en": "Kippenburger",
      "fr": "Kippenburger"
    },
    "description": {
      "nl": "Warme snack.",
      "en": "Warme snack.",
      "fr": "Warme snack."
    },
    "price": "EUR 5,00"
  },
  {
    "category": "warm",
    "name": {
      "nl": "Fishburger",
      "en": "Fishburger",
      "fr": "Fishburger"
    },
    "description": {
      "nl": "Warme snack.",
      "en": "Warme snack.",
      "fr": "Warme snack."
    },
    "price": "EUR 6,00"
  },
  {
    "category": "warm",
    "name": {
      "nl": "Mexicano (met broodje)",
      "en": "Mexicano (met broodje)",
      "fr": "Mexicano (met broodje)"
    },
    "description": {
      "nl": "Warme snack met broodje.",
      "en": "Warme snack met broodje.",
      "fr": "Warme snack met broodje."
    },
    "price": "EUR 5,20"
  },
  {
    "category": "warm",
    "name": {
      "nl": "Mexicano (zonder broodje)",
      "en": "Mexicano (zonder broodje)",
      "fr": "Mexicano (zonder broodje)"
    },
    "description": {
      "nl": "Warme snack zonder broodje.",
      "en": "Warme snack zonder broodje.",
      "fr": "Warme snack zonder broodje."
    },
    "price": "EUR 3,50"
  },
  {
    "category": "warm",
    "name": {
      "nl": "Kipcorn (met broodje)",
      "en": "Kipcorn (met broodje)",
      "fr": "Kipcorn (met broodje)"
    },
    "description": {
      "nl": "Warme snack met broodje.",
      "en": "Warme snack met broodje.",
      "fr": "Warme snack met broodje."
    },
    "price": "EUR 4,50"
  },
  {
    "category": "warm",
    "name": {
      "nl": "Kipcorn (zonder broodje)",
      "en": "Kipcorn (zonder broodje)",
      "fr": "Kipcorn (zonder broodje)"
    },
    "description": {
      "nl": "Warme snack zonder broodje.",
      "en": "Warme snack zonder broodje.",
      "fr": "Warme snack zonder broodje."
    },
    "price": "EUR 2,80"
  },
  {
    "category": "warm",
    "name": {
      "nl": "Gebakken Boulette (met broodje)",
      "en": "Gebakken Boulette (met broodje)",
      "fr": "Gebakken Boulette (met broodje)"
    },
    "description": {
      "nl": "Warme snack met broodje.",
      "en": "Warme snack met broodje.",
      "fr": "Warme snack met broodje."
    },
    "price": "EUR 5,00"
  },
  {
    "category": "warm",
    "name": {
      "nl": "Gebakken Boulette (zonder broodje)",
      "en": "Gebakken Boulette (zonder broodje)",
      "fr": "Gebakken Boulette (zonder broodje)"
    },
    "description": {
      "nl": "Warme snack zonder broodje.",
      "en": "Warme snack zonder broodje.",
      "fr": "Warme snack zonder broodje."
    },
    "price": "EUR 3,50"
  },
  {
    "category": "supplementen",
    "name": {
      "nl": "Smos",
      "en": "Smos",
      "fr": "Smos"
    },
    "description": {
      "nl": "Supplement / extra optie.",
      "en": "Supplement / extra optie.",
      "fr": "Supplement / extra optie."
    },
    "price": "EUR 1,00"
  },
  {
    "category": "supplementen",
    "name": {
      "nl": "Extra groenten",
      "en": "Extra groenten",
      "fr": "Extra groenten"
    },
    "description": {
      "nl": "Supplement / extra optie.",
      "en": "Supplement / extra optie.",
      "fr": "Supplement / extra optie."
    },
    "price": "EUR 0,40"
  },
  {
    "category": "supplementen",
    "name": {
      "nl": "Extra saus",
      "en": "Extra saus",
      "fr": "Extra saus"
    },
    "description": {
      "nl": "Supplement / extra optie.",
      "en": "Supplement / extra optie.",
      "fr": "Supplement / extra optie."
    },
    "price": "EUR 0,60"
  },
  {
    "category": "supplementen",
    "name": {
      "nl": "Extra vlees vis kaas",
      "en": "Extra vlees vis kaas",
      "fr": "Extra vlees vis kaas"
    },
    "description": {
      "nl": "Supplement / extra optie.",
      "en": "Supplement / extra optie.",
      "fr": "Supplement / extra optie."
    },
    "price": "EUR 1,50"
  },
  {
    "category": "supplementen",
    "name": {
      "nl": "Multigranen bagnat",
      "en": "Multigranen bagnat",
      "fr": "Multigranen bagnat"
    },
    "description": {
      "nl": "Supplement / extra optie.",
      "en": "Supplement / extra optie.",
      "fr": "Supplement / extra optie."
    },
    "price": "EUR 0,60"
  },
  {
    "category": "supplementen",
    "name": {
      "nl": "Fitnessbroodje",
      "en": "Fitnessbroodje",
      "fr": "Fitnessbroodje"
    },
    "description": {
      "nl": "Supplement / extra optie.",
      "en": "Supplement / extra optie.",
      "fr": "Supplement / extra optie."
    },
    "price": "EUR 0,80"
  },
  {
    "category": "supplementen",
    "name": {
      "nl": "Glutenvrij",
      "en": "Glutenvrij",
      "fr": "Glutenvrij"
    },
    "description": {
      "nl": "Supplement / extra optie.",
      "en": "Supplement / extra optie.",
      "fr": "Supplement / extra optie."
    },
    "price": "EUR 2,00"
  }
];
