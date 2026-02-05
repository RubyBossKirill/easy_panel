Rails.application.routes.draw do
  # Health check
  get "up" => "rails/health#show", as: :rails_health_check
  get "health" => "rails/health#show"

  # API routes
  namespace :api do
    namespace :v1 do
      # Authentication
      post 'auth/login', to: 'auth#login'
      post 'auth/register', to: 'auth#register'
      post 'auth/refresh', to: 'auth#refresh'
      post 'auth/logout', to: 'auth#logout'
      get 'auth/me', to: 'auth#me'

      # Resources
      resources :users, only: %i[index show create update destroy]
      resources :roles, only: %i[index show create update destroy]
      resources :clients, only: %i[index show create update destroy]
      resources :appointments, only: %i[index show create update destroy] do
        member do
          patch :update_status
        end
      end
      resources :time_slots, only: %i[index show create update destroy] do
        collection do
          post :bulk_create
        end
      end
      resources :payments, only: %i[index show create]
    end
  end
end
