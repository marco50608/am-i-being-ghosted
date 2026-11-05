# Am I Being Ghosted?

A Bayesian reality check for a job hunt. Enter the date you started applying, how many applications you sent and how many interviews you got, and the page tells you whether the silence is ordinary ghosting or a sign to change something.

Live at https://marco50608.github.io/am-i-being-ghosted/ (yokai edition).

Everything runs in the browser. The log, streak and badges stay in the visitor's browser. A backup code moves them to another phone or computer without an account.

## The anonymous dataset

Each check of a visitor's own numbers adds one row to a Google Sheet through a Google Apps Script web app. A "Don't add my numbers" box under the Check button opts out, and the browser remembers that choice. The example numbers are never added.

| Column | What it holds |
|---|---|
| received_at | when the row arrived |
| theme | which edition sent the row, yokai for now |
| start, days | start date of the search and days since then |
| applications, interviews, offers | counts |
| market, field, channel | optional menu answers |

No names, email addresses, IDs, cookies or free text. The script never sees IP addresses. Legal basis: GDPR Art. 6(1)(f), with the opt-out box for objections under Art. 21.

## Setup

1. Open the Google Sheet that should collect the rows. Open Extensions > Apps Script, replace the code with `apps-script/Code.gs` and save.
2. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone. Google warns that the app is unverified because it is your own script. Choose Advanced and continue. The script only asks for access to that one spreadsheet.
3. Copy the web app URL that ends in `/exec` into `config.js`.
4. Push this folder to a GitHub repository and turn on Settings > Pages > Deploy from a branch (main, /docs).

Opening the `/exec` URL in a browser shows how many check-ins have arrived. After editing `Code.gs`, use Deploy > Manage deployments, edit the deployment and pick New version, so the URL stays the same.

The fonts are served from this repository, so the pages make no requests to Google Fonts.
