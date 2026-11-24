# Axiom agent keys (Web Bot Auth)

Axiom's outbound agents sign their HTTP requests (RFC 9421, Ed25519) so a door can check that deployaxiom.com stands behind them.

- Public key directory: https://deployaxiom.com/.well-known/http-message-signatures-directory (source: `.well-known/http-message-signatures-directory`, headers in `netlify.toml`).
- Key id (JWK thumbprint): `KTM1LYy9u857Dgc65zU7hSZxpCD9ivQDTGQHEdIArTc`
- Private key: never in this repo. It stays on the operator's machine, outside any repository.
- The directory response carries its own signature (tag `http-message-signatures-directory`, over `"@authority";req`). It expires 2026-12-24 19:10 UTC. Before then, re-sign with `tools/key_directory.py` from the public agent-front-door repo, paste the new `Signature-Input` and `Signature` values into `netlify.toml`, test, and ship.
- Revoke the key: delete its entry from the directory file (and its headers), ship, and doors that re-check every 5 minutes stop accepting it.
