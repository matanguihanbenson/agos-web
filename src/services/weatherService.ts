import { WeatherData, CurrentWeather, WeatherForecast } from '@/types/weather';

class WeatherService {
  private apiKey: string = process.env.NEXT_PUBLIC_WEATHER_API_KEY || '';
  private baseUrl: string = 'https://api.weatherapi.com/v1'; // Example API

  async getCurrentWeather(): Promise<CurrentWeather> {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/current.json?key=${this.apiKey}&q=${location}`);
      
      // Mock data for development
      return {
        location: 'Manila, Philippines',
        temperature: 28,
        condition: 'Partly Cloudy',
        humidity: 75,
        windSpeed: 12,
        windDirection: 'NE',
        icon: 'partly-cloudy',
        lastUpdated: new Date().toISOString(),
        isStormWarning: false,
      };
    } catch (error) {
      console.error('Failed to fetch current weather:', error);
      throw new Error('Unable to fetch current weather data');
    }
  }

  async getWeatherForecast(days: number = 3): Promise<WeatherForecast> {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/forecast.json?key=${this.apiKey}&q=${location}&days=${days}&hours=24`);
      
      // Mock data for development
      const mockForecast: WeatherForecast = {
        dailyForecasts: Array.from({ length: days }, (_, index) => ({
          date: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          minTemp: 24 + Math.random() * 3,
          maxTemp: 30 + Math.random() * 5,
          condition: ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain'][Math.floor(Math.random() * 4)],
          icon: 'sunny',
          precipitationChance: Math.floor(Math.random() * 60),
          hourlyForecasts: Array.from({ length: 24 }, (_, hour) => ({
            time: `${hour.toString().padStart(2, '0')}:00`,
            temperature: 25 + Math.random() * 8,
            condition: 'Clear',
            icon: 'clear',
            precipitationChance: Math.floor(Math.random() * 30),
          })),
        })),
      };
      
      return mockForecast;
    } catch (error) {
      console.error('Failed to fetch weather forecast:', error);
      throw new Error('Unable to fetch weather forecast data');
    }
  }

  async getCompleteWeatherData(): Promise<WeatherData> {
    const [current, forecast] = await Promise.all([
      this.getCurrentWeather(),
      this.getWeatherForecast(),
    ]);

    return { current, forecast };
  }
}

export const weatherService = new WeatherService();
