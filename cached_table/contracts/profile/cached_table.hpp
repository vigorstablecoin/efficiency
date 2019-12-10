/**
 * A cached_table is a caching wrapper for eosio::multi_index tables
 */
#pragma once

#include <utility>
#include <map>

#include "eosio/eosio.hpp"


template <eosio::name::raw TableName, typename T>
class cached_table {

private:

  typedef struct {
    eosio::name payer;
    T entry;
  } cache_entry;

  typedef typename std::map<uint64_t, cache_entry>::iterator cache_iterator;

  std::map<uint64_t, cache_entry> cache;
  eosio::multi_index<TableName, T> table;

public:

  cached_table(eosio::name code, uint64_t scope) : table(code, scope) {}

  ~cached_table() {
    // save the result
    auto itr = cache.begin();
    while (itr != cache.end()) {
      if (itr->second.payer != eosio::name{""}) {  // no payer means the record is not changed
        auto titr = table.find(itr->first);
        if (titr == table.end()) {
          table.emplace(itr->second.payer, [&](auto& obj) {
            obj = itr->second.entry;
          });
        } else {
          table.modify(titr, itr->second.payer, [&](auto& obj) {
            obj = itr->second.entry;
          });
        }
      }
      itr++;
    }
  }

  cache_iterator begin() { return cache.begin(); }

  cache_iterator end() { return cache.end(); }

  cache_iterator find(uint64_t primary) {
    auto itr = cache.find(primary);
    if (itr == cache.end()) {
      auto titr = table.find(primary);
      if (titr == table.end()) return cache.end();
      auto res = cache.emplace(primary, cache_entry{eosio::name{""}, *titr});
      return res.first;
    }
    return itr;
  }

  template <typename Lambda>
  cache_iterator emplace(eosio::name payer, Lambda&& constructor) {
    T obj;
    constructor(obj);
    auto pk = obj.primary_key();

    auto res = cache.emplace(pk, cache_entry{payer, obj});
    return res.first;
  }

  template <typename Lambda>
  void modify(cache_iterator itr, eosio::name payer, Lambda&& updater) {
    auto& mutableobj = const_cast<T&>((itr->second).entry); // Do not forget the auto& otherwise it would make a copy and thus not update at all.
    updater(mutableobj);

    itr->second = cache_entry{payer, mutableobj};
  }

  cache_iterator erase(cache_iterator itr) {
    auto pk = itr->first;
    auto titr = table.find(pk);
    if (titr != table.end()) table.erase(titr);

    return cache.erase(itr);
  }

};
