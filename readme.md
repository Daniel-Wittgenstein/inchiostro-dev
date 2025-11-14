
# Inchiostro Story Template

This is the repo where Inchiostro is being developed.

If you are looking for more generic info about Inchiostro, (click here)[https://daniel-wittgenstein.github.io/inchiostro-website/]

# Developing Inchiostro

No build step, no npm used.

After you cloned the repo, add an "ink-package.json" to the root directory, with contents (the file is .gitignored):

  {
    "projectName": "Testing Inchiostro Dev",
    "entryFile": "story.js",
    "inkFile": "story.ink"
  }

This turns the folder into a valid Inkberry project. Then open the folder with the Inkberry app. Now you can implement new features and test them.

# Releasing a new version of Inchiostro

Bump the version number inside "template-package.json"

(The "template-package.json" is for documentation purposes, but also for Inkberry. It's necessary so that Inkberry accepts this as a story template when it is loaded locally via "Load a Story Template". Important: the files should all be in the root folder of the zip. Not in a nested folder, otherwise Inkberry will fail to load the template.)

Then just manually zip up the folder contents (without the .gitignored files, of course) and release them.
