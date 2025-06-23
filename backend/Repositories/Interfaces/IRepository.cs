using System.Linq.Expressions;

namespace EshoppingZoneAPI.Repositories.Interfaces
{
    public interface IRepository<T> where T : class
    {
        Task<List<T>> GetAllAsync();
        Task<T?> GetByIdAsync(object id); // Accept string or int
        Task<List<T>> FindAsync(Expression<Func<T, bool>> predicate);
        Task AddAsync(T entity);
        void Update(T entity);
        void Delete(T entity);
        Task DeleteAsync(T entity); // ✅ Added
        Task DeleteRangeAsync(IEnumerable<T> entities); // ✅ Added
        Task SaveChangesAsync();
    }
}
