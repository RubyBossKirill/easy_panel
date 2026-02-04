# Encryption keys for Active Record Encryption
# In production, these should be stored in encrypted credentials

Rails.application.configure do
  config.active_record.encryption.primary_key = ENV.fetch('ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY', 'a0SIgOxb8izHTqNosRdtXwaDHUHDKzq2')
  config.active_record.encryption.deterministic_key = ENV.fetch('ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY', 'aWvZgehZjfIUWIFv8alVfjhu4iY9JONz')
  config.active_record.encryption.key_derivation_salt = ENV.fetch('ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT', 'Y400MKSv4KFCdvKHIJZGOjEBwLEovPHW')
end
