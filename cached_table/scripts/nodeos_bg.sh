#!/usr/bin/env bash

# Cleanup old instances of nodeos or keosd running
pkill nodeos keosd

# Cleanup the data from nodeos
#rm -rf ~/.local/share/eosio/nodeos/data
rm -rf ~/Library/Application\ Support/eosio/nodeos/data

# Start a new nodeos
#nodeos -e -p eosio --http-validate-host=false --delete-all-blocks --plugin eosio::chain_api_plugin --contracts-console --plugin eosio::http_plugin --plugin eosio::history_api_plugin --verbose-http-errors --max-transaction-time=10000
nodeos -e -p eosio --plugin eosio::producer_plugin --plugin eosio::producer_api_plugin --plugin eosio::chain_api_plugin --plugin eosio::http_plugin --plugin eosio::state_history_plugin --max-transaction-time=10000 --access-control-allow-origin='*' --contracts-console --http-validate-host=false --trace-history --chain-state-history --verbose-http-errors --filter-on='*' --disable-replay-opts >> nodeos.log 2>&1 &
