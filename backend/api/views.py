from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

@api_view(['GET'])
def health_check(request):
    """
    Health check endpoint to verify backend connectivity from Expo app.
    """
    return Response({
        'status': 'online',
        'message': 'KeralaGO Backend API is running smoothly',
        'version': '1.0.0'
    }, status=status.HTTP_200_OK)
