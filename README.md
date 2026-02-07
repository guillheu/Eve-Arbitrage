# Eve Arbitrage

[https://eve-arbitrage.guillheu.dev](https://eve-arbitrage.guillheu.dev)

A web tool to auto-compute arbitrage in Eve Online.

Written in [Gleam](https://gleam.run/), using [Lustre](https://hexdocs.pm/lustre/index.html)

## ⚠️**WARNING**⚠️
**ALWAYS** check that what you're paying for a multibuy is at least *close* to the expected multibuy price listed on the page. If it's too much higher, wait a couple minutes, refresh the sell orders ("From" station) data and compute the multibuys again.


## Features
- Configurable collateral, accounting level and ships
- Automatically pick the most profitable trades
- Copy-pastable optimized multibuys

![Screenshot of the Eve Arbitrage web page](/readme/screenshot.png)

## How it works
1. Fetch sell orders from the starting station & sort them from cheapest to most expensive
2. Fetch buy orders from the destination station & sort them from most expensive to cheapest
3. Combine buy and sell orders of the same items into the most profitable "trades" possible
4. Add item metadata to the trades (name, m3)
5. Compute profit density for all trades (profit/m3) ([See here why this is what we chose](#how-does-this-tool-pick-trades))
6. Pick trades from highest to lowest profit density, ensuring they fit within the cargo space and collateral limits
7. Compute and display multibuys

## FAQ
### How does this tool pick trades?
It will sort trades based on **profit per m3**. I found in practice that this is a pretty good approximation of actual optimal trades. It does mean however that for lower collaterals the trades picked won't be as optimal. It would be possible to implement multiple sorting algorithms for different profiles. Open an issue if you'd like that!

### Why not compute actual optimal trades then?
As far as I can tell, picking optimal trades is a dynamic programming problem with 2 continuous variables. Even if I knew how to solve it, the single thread allocated to a web page would not be able to handle it.

### Can I log into my account to import my ships automatically?
No. There are currently no plans to allow users to log in, [and this is why](#is-this-a-static-page-or-is-there-a-backend-somewhere)

### Why multiple multibuys? Why not just one big multibuy?
Multibuys are susceptible to slippage. When a multibuy would purchase from multiple sell orders, it will have you pay a single unit price (the highest) to all of them. This means some sellers will get more ISK than they listed the item for, and you'd have spent more money than you expected. To remidy this, we give the user one multibuy per price point per item. If an item would have 3 prices, you'll get 3 multibuys.

### Is this a static page or is there a backend somewhere?
This is a static webpage. While having a backend would be practical in some aspects (caching data, adding new types after game updates, telemetry, user log-in via Eve SSO...), it would also require significant upkeep, not to mention actual hosting costs. While I'm not opposed to it in theory, I'd rather wait to see if the demand for it warrants this kind of effort. So for now, this is a static web page.