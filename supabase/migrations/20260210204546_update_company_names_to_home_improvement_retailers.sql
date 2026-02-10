/*
  # Update Company Names to Home Improvement Retailers

  ## Summary
  Updates existing sample data to replace retail company names with home improvement retailers:
  - Walmart → Lowe's
  - Target Corporation → Home Depot
  - Kroger Company → Ace Hardware
  - Costco Wholesale → Menards
  - Amazon Fulfillment Services → Tractor Supply Co.

  ## Changes
  - Updates trading_partners table names
  - Updates any related data that references these companies
*/

-- Update trading partner names
UPDATE trading_partners SET name = 'Lowe''s' WHERE name = 'Walmart Stores Inc.';
UPDATE trading_partners SET name = 'Home Depot' WHERE name = 'Target Corporation';
UPDATE trading_partners SET name = 'Ace Hardware' WHERE name = 'Kroger Company';
UPDATE trading_partners SET name = 'Menards' WHERE name = 'Costco Wholesale';
UPDATE trading_partners SET name = 'Tractor Supply Co.' WHERE name = 'Amazon Fulfillment Services';
