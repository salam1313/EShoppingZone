using AutoMapper;
using EshoppingZoneAPI.DTOs;
using EshoppingZoneAPI.Models;

namespace EshoppingZoneAPI.MappingProfiles
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<ProductDTO, Product>()
                .ForMember(dest => dest.ProductId, opt => opt.Ignore()); // ID generated in model
            CreateMap<Product, ProductDTO>();
            CreateMap<CartItem, CartItemResponseDTO>();
            CreateMap<CategoryDTO, Category>()
                .ForMember(dest => dest.CategoryId, opt => opt.Ignore());
            CreateMap<Category, CategoryDTO>();
            CreateMap<SubcategoryDTO, Subcategory>()
                .ForMember(dest => dest.SubcategoryId, opt => opt.Ignore());
            CreateMap<Subcategory, SubcategoryDTO>();
        }
    }
}
