import { LuApple, LuBeef, LuCarrot, LuEgg, LuMilk, LuWheat } from 'react-icons/lu'

// Mirrors scripts/stips-scraper/src/categories.js's Serbian names, which is
// what actually ends up in the sheet's Kategorija column - `name` is used to
// match/filter data, `slug` is used for i18n lookup (t(`categories.${slug}`)).
export const CATEGORIES = [
  { name: 'Jaja i živinsko meso', slug: 'eggsPoultry', icon: LuEgg },
  { name: 'Meso', slug: 'meat', icon: LuBeef },
  { name: 'Mlečni proizvodi', slug: 'dairy', icon: LuMilk },
  { name: 'Mleko', slug: 'milk', icon: LuMilk },
  { name: 'Povrće', slug: 'vegetables', icon: LuCarrot },
  { name: 'Voće', slug: 'fruit', icon: LuApple },
  { name: 'Žitarice', slug: 'grains', icon: LuWheat },
]
