namespace YaaImg.Domain.Exceptions;

public class ProviderException : Exception
{
    public string ErrorCode { get; }

    public ProviderException(string message, string errorCode = "PROVIDER_ERROR")
        : base(message)
    {
        ErrorCode = errorCode;
    }
}
