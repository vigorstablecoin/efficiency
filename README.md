# VIGOR efficiency experiments

The goal of this work was to check what optimizations could be done in our smart contract
code to maximize efficiency and reduce the CPU usage.

## Initial state

The start of this experiment had these results for a thousand table writes of an uint64_t
field:
```bash
$ eoslime test

  Test profile contract
CPU: 354 NET: 184
    ✓ update John Doe profile (140ms)
CPU: 283 NET: 192
    ✓ update Jane Doe profile (185ms)
CPU: 12009 NET: 104
    ✓ John Doe count one thousand (228ms)
CPU: 14588 NET: 104
    ✓ Jane Doe count one thousand (213ms)

  4 passing (3s)
```
meaning that between 12ms and 14.5ms were being billed for the "count one thousand" action
CPU when using a multi_index table. These values come from the transaction receipt, so they
are the most accurate possible according to the eosio internal accounting.

## Routes identified:

- [Tables caching](cached_table)
- [Smart tables](smart_table)
- ...

### Tables caching

The idea is cache the reads/writes from/to multi_index tables into a cache `map`, so that
many reads of the same object just require one deserialization an many writes to the same
object only do one final serialization and write to eosio RAM.

You can check the code for this experiment in [cached_table](cached_table).

The final results from the same operations are:
```bash
$ eoslime test

  Test profile contract
CPU: 390 NET: 184
    ✓ update John Doe profile (197ms)
CPU: 342 NET: 192
    ✓ update Jane Doe profile (237ms)
CPU: 10602 NET: 104
    ✓ John Doe count one thousand (194ms)
CPU: 11437 NET: 104
    ✓ Jane Doe count one thousand (202ms)

  4 passing (3s)
```

So this experiment took the CPU billing ~ 10% lower, and this could be improved a bit by
using an `unordered_map` instead of a `map`, which is sorted by nature, but the `unordered_map`
container in eosio is faulty, as you can check in this github issue of [EOSIO.CDT](https://github.com/EOSIO/eosio.cdt/issues/685).

So turns out that there's not much difference, from the efficiency point of view, of using
`multi_index` tables and `map`s.


## Smart tables

The idea is to make tables lazy, by using a `deque` to store the latest *N* entries and flush
the contents of of the cache on *N+1*, performing only one write to the multi_index table per
each entry in the cache.

The final results from the same operations, added by another 10x the amount, are as follows:
```bash
$ eoslime test

  Test profile contract
CPU: 306 NET: 184
    ✓ update John Doe profile (244ms)
CPU: 298 NET: 192
    ✓ update Jane Doe profile (151ms)
CPU: 1191 NET: 104
    ✓ John Doe count one thousand (120ms)
CPU: 9209 NET: 104
    ✓ Jane Doe count ten thousand (130ms)

  4 passing (3s)
```

Please notice that for one thousand updates the difference in efficiency is around 10x (90%
saving on billed CPU), but it is also non linear, so for **ten thousand** (10x more) the total
CPU billed only grew by less than 8x.

## Conclusions

There's a lot of room to improve efficiency of smart contract code. `multi_index` tables are
expensive in CPU but are well optimized facing STL counterparts like `std::map`. Where we can
get more benefits in terms of efficiency is to minimize the writes by using internal structures
that do not require hashing/sorting, like `std::vector` or even better `std::deque`, if we do
not require traversing the data in a single contiguous data block.

Hope this shows the importance of optimization and also sheds some light on the internals of
eosio and what/where we can improve.

Enjoy!

PRC
