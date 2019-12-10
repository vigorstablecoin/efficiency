/**
 * A smart_table is a caching wrapper for eosio::multi_index tables
 */
#pragma once

#include <deque>

#include "eosio/eosio.hpp"


#define DEFAULT_CACHE_SIZE 100

template <eosio::name::raw TableName, typename T>
class smart_table : public eosio::multi_index<TableName, T> {

private:

  typedef struct {
    uint64_t key;
    eosio::name payer;
    T entry;
  } cache_entry;

  typedef typename eosio::multi_index<TableName, T> table;
  typedef typename eosio::multi_index<TableName, T>::const_iterator table_iterator;

  int cache_size;
  std::deque<cache_entry> cache;

public:

  smart_table(eosio::name code, uint64_t scope) : table(code, scope), cache_size(DEFAULT_CACHE_SIZE) {}
  smart_table(eosio::name code, uint64_t scope, int size) : table(code, scope), cache_size(size) { }

  ~smart_table() {
    flush();
  }

  void flush() {
    for (auto elem: cache) {
      auto itr = table::find(elem.key);
      if (itr == table::end()) {
        table::emplace(elem.payer, [&](auto& obj) {
          obj = elem.entry;
        });
      } else {
        table::modify(itr, elem.payer, [&](auto& obj) {
          obj = elem.entry;
        });
      }
    }
    cache.clear();
  }

  table_iterator find(uint64_t primary) {
    flush();
    return table::find(primary);
  }

  template <typename Lambda>
  void modify(table_iterator itr, eosio::name payer, Lambda&& updater) {
    uint64_t pk = (*itr).primary_key();
    int place = find_in_cache(pk);
    if (place >= 0) {
      auto& obj = cache[place].entry;
      updater(obj);
    } else {
      // Do not forget the auto& otherwise it would make a copy and thus not update at all.
      auto& mutableobj = const_cast<T&>(*itr);
      updater(mutableobj);
      if (cache.size() == cache_size) flush();
      cache.push_front(cache_entry{pk, payer, mutableobj});
    }
  }

  table_iterator erase(table_iterator itr) {
    flush();
    return table::erase(itr);
  }

private:

  int find_in_cache(uint64_t key) {
    for (int i = 0; i < cache.size(); i++) {
      if (cache[i].key == key) return i;
    }
    return -1;
  }

};
