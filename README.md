# TableView
#### Virtualized Table UI
**Instructions:**
- Checkout this repo
- Install [yarn](https://yarnpkg.com/en/) if needed.
- On the command line navigate to the repo's folder
- Run `yarn install`
- Run `yarn start` and wait for project to build
- In Chrome (has tobe chrome for now) navigate to `localhost:8090`

You can experient with the number of rows by changing the variable `rowCount` in `index.html`. The content of the rows is also defined there.

At the moment chrome can only display ~1.6 mil rows because of a scroll height limitation of the browser. A custom scrolling library will need to be used for larger tables.

## Next Steps
This repo will be integrated into the HugeCSV viewer in the browser.
