module Api
  module V1
    class DashboardController < ApplicationController
      before_action :authenticate_user!

      def stats
        unless has_permission?('view_dashboard')
          render json: { error: 'Forbidden' }, status: :forbidden
          return
        end

        # Filter appointments based on user role
        base_appointments = if current_user.role == 'Employee'
          Appointment.where(employee_id: current_user.id)
        else
          Appointment.all
        end

        # Filter clients based on user role
        base_clients = if current_user.role == 'Employee'
          # Employees see clients they have appointments with
          Client.joins(:appointments).where(appointments: { employee_id: current_user.id }).distinct
        else
          Client.all
        end

        today = Date.today

        stats = {
          today_appointments: base_appointments.where(date: today).count,
          total_clients: base_clients.count,
          completed_appointments: base_appointments.where(status: 'completed').count,
          cancelled_appointments: base_appointments.where(status: 'cancelled').count
        }

        render json: stats
      end
    end
  end
end
