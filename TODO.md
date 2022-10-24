# A list of GCP ToDos

[ ] Check if file exists by that name before sending the file to GCP
a. Will also want to keep the popup window open if the check fails to allow resubmission

[ ] Add validation that the name includes the correct image extension
a. Or allow for a dropdown of allowed extension types?

[ ] Add validation for bucket folder to include or exclude leading and trailing slashes

[ ] Add styling (ie. embed the image url response in a `img` html tag to allow for centering, etc)
a. Check if we can use another plugin for this?

[ ] Allow ability to edit an image
a. Need some way to organize the metadata for an image to provide (or do we just extract it from the URL?)

[ ] Allow to delete image
a. Would need a propt to ask if just want to delete the URL in the note or delete remotely too
b. Would also need the metadata to then pass the object id to the delete API

[ ] Add option to include a citation below the image
a. Again the citation would need to live in the image metadata somewhere
