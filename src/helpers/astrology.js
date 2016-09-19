'use strict'

function calculateZodiac(birthday) {
  let date  = new Date(birthday)
  let month = date.getMonth()
  let day   = date.getDay()
  if (month == 1 && day >=20 || month == 2 && day <=18) { return 'Aquarius'
  } else if (month == 2 && day >=19 || month == 3 && day <=20) { return 'Pisces'
  } else if (month == 3 && day >=21 || month == 4 && day <=19) { return 'Aries'
  } else if (month == 4 && day >=20 || month == 5 && day <=20) { return 'Taurus'
  } else if (month == 5 && day >=21 || month == 6 && day <=21) { return 'Gemini'
  } else if (month == 6 && day >=22 || month == 7 && day <=22) { return 'Cancer'
  } else if (month == 7 && day >=23 || month == 8 && day <=22) { return 'Leo'
  } else if (month == 8 && day >=23 || month == 9 && day <=22) { return 'Virgo'
  } else if (month == 9 && day >=23 || month == 10 && day <=22) { return 'Libra'
  } else if (month == 10 && day >=23 || month == 11 && day <=21) { return 'Scorpio'
  } else if (month == 11 && day >=22 || month == 12 && day <=21) { return 'Sagittarius'
  } else { return 'Capricorn' }
}

function calculateChinese(birthday) {
  let date  = new Date(birthday)
  let year  = date.getFullYear()
  let comp  = (1901 - year) % 12
  if (comp == 1 || comp == -11) { return 'Rat'
  } else if (comp == 0) { return 'Ox'
  } else if (comp == 11 || comp == -1) { return 'Tiger'
  } else if (comp == 10 || comp == -2) { return 'Rabbit'
  } else if (comp == 9 || comp == -3) { return 'Dragon'
  } else if (comp == 8 || comp == -4) { return 'Snake'
  } else if (comp == 7 || comp == -5) { return 'Horse'
  } else if (comp == 6 || comp == -6) { return 'Sheep'
  } else if (comp == 5 || comp == -7) { return 'Monkey'
  } else if (comp == 4 || comp == -8) { return 'Cock'
  } else if (comp == 3 || comp == -9) { return 'Dog'
  } else { return 'Boar' }
}

function calculateBirthstone(birthday) {
  let zodiac = calculateZodiac(birthday)
  switch(zodiac) {
    default: return null
    case 'Aquarius': return 'Amethyst'
    case 'Pisces': return 'Aquamarine'
    case 'Aries': return 'Diamond'
    case 'Taurus': return 'Emerald'
    case 'Gemini': return 'Pearl'
    case 'Cancer': return 'Ruby'
    case 'Leo': return 'Peridot'
    case 'Virgo': return 'Sapphire'
    case 'Libra': return 'Opal'
    case 'Scorpio': return 'Topaz'
    case 'Sagittarius': return 'Turquoise'
    case 'Capricorn': return 'Garnet'
  }
}

function calculatePlanet(birthday) {
  let zodiac = calculateZodiac(birthday)
  switch(zodiac) {
    default: return null
    case 'Aquarius': return 'Uranus'
    case 'Pisces': return 'Neptune'
    case 'Aries': return 'Mars'
    case 'Taurus': return 'Venus'
    case 'Gemini': return 'Mercury'
    case 'Cancer': return 'Mercury'
    case 'Leo': return 'Sun'
    case 'Virgo': return 'Earth'
    case 'Libra': return 'Venus'
    case 'Scorpio': return 'Pluto'
    case 'Sagittarius': return 'Jupiter'
    case 'Capricorn': return 'Saturn'
  }
}

function calculateElement(birthday) {
  let zodiac = calculateZodiac(birthday)
  switch(zodiac) {
    default: return null
    case 'Aquarius': return 'Air'
    case 'Pisces': return 'Water'
    case 'Aries': return 'Fire'
    case 'Taurus': return 'Earth'
    case 'Gemini': return 'Air'
    case 'Cancer': return 'Water'
    case 'Leo': return 'Fire'
    case 'Virgo': return 'Earth'
    case 'Libra': return 'Air'
    case 'Scorpio': return 'Water'
    case 'Sagittarius': return 'Fire'
    case 'Capricorn': return 'Earth'
  }
}

module.exports = {
  calculateZodiac    : calculateZodiac,
  calculateChinese   : calculateChinese,
  calculateBirthstone: calculateBirthstone,
  calculatePlanet    : calculatePlanet,
  calculateElement   : calculateElement
}

/*
export function calculateTraits(birthday) {
  let zodiac = calculateZodiac(birthday)
  switch(zodiac) {
    default: return null
    case 'Aquarius': return ['Independent', 'Creative', 'Entertaining', 'Stimulating', 'Progressive']
    case 'Pisces': return ['Romantic', 'Generous', 'Receptive', 'Honest', 'Affectionate']
    case 'Aries': return ['Loyal', 'Courageous', 'Adventurous', 'Confident', 'Passionate']
    case 'Taurus': return ['Affectionate', 'Reliable', 'Ambitious', 'Practical', 'Patient']
    case 'Gemini': return ['Inquisitive', 'Clever', 'Adaptable', 'Lively', 'Communicative']
    case 'Cancer': return ['Imaginative', 'Sympathetic', 'Placid', 'Intuitive', 'Home Lover']
    case 'Leo': return ['Honest', 'Generous', 'Self-motivated', 'Warm-hearted', 'Enthusiastic']
    case 'Virgo': return ['Orderly', 'Modest', 'Diligent', 'Analytical', 'Self-sufficient']
    case 'Libra': return ['Charming', 'Perceptive', 'Diplomatic', 'Pleasant', 'Refined']
    case 'Scorpio': return ['Focused', 'Determined', 'Emotional', 'Hypnotic', 'Complex']
    case 'Sagittarius': return ['Ethical', 'Humorous', 'Generous', 'Dynamic', 'Compassionate']
    case 'Capricorn': return ['Stable', 'Trustworthy', 'Persistent', 'Ambitious', 'Patient']
  }
}
*/