## Inspiration
I learned my English - at my highschool age - by reading English dictionary each every entry.
This webapp is a reflection of my experience, to let users read and listen right sentenses - to remember a new word.

## What it does
- Works as regular dictionary, as expected
- It prompts most important (random) 500/1000/2000/4000 words!
- It speaks the pronouciation, definition, - and example sentenses
- It offers a quiz, to assemble a sentence by listening!
- translation HINT is from Gemini-Nano
- It is MULTI LINGUAL... good for Japanese, Chinese, Spanish learners of English! (more language would come as Gemini evolves)

## How it works - and Enabling local AI functionalities
- Javascript by Gemini
- Translation to 100 languages = Gemini Nano, embeded on Chrome
- Regeneration of annother example sentense, based on the word's definition = Gemini Nano, embeded on Chrome
- Please go `chrome://flags/#translation-api` and enable
- Please go `chrome://flags/#prompt-api-for-gemini-nano` and enable
- Please go `chrome://flags/#optimization-guide-on-device-model` and enable

## How we built it
- Gemini (Advance) coded mostly 
- https://dictionaryapi.dev/ offered a good fundation of this idea
- I had non-Gemini version, and enabled translation to motivate users

## Challenges we ran into
- I only had Chromebook - which did not have Gemini-nano. I had to get a new laptop!

## Accomplishments that we're proud of
- It is fun, and practical to support all people who wants to learn!
- Web-only, no installation, no login!

## What's next for DXionally AI
- Better color, better sound (or effect) to keep motivating learners!
