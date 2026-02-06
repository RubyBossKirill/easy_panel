module Api
  module V1
    class DashboardController < BaseController
      before_action :authenticate_user!

      def stats
        return render_forbidden unless current_user.has_permission?('view_dashboard')

        # Filter appointments based on user role
        base_appointments = if current_user.can_view_all?
                              Appointment.all
                            else
                              Appointment.where(employee_id: current_user.id)
                            end

        # Filter clients based on user role
        base_clients = if current_user.can_view_all?
                         Client.all
                       else
                         # Employees see clients they have appointments with
                         Client.joins(:appointments).where(appointments: { employee_id: current_user.id }).distinct
                       end

        today = Date.today

        stats = {
          today_appointments: base_appointments.where(date: today).count,
          total_clients: base_clients.count,
          completed_appointments: base_appointments.where(status: 'completed').count,
          cancelled_appointments: base_appointments.where(status: 'cancelled').count
        }

        render_success(stats)
      end
    end
  end
end
