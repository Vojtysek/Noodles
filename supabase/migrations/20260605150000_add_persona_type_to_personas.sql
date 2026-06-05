alter table personas add column persona_type text check (persona_type in ('skrblik', 'investor', 'technik', 'ekolog', 'lhostejny', 'novacek'));
