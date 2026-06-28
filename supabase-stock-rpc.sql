create or replace function public.decrement_product_stock(p_product_id bigint, p_quantity integer)
returns bigint
language plpgsql
security definer
as $$
declare
  current_stock integer;
  new_stock integer;
begin
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'quantity must be greater than 0';
  end if;

  select stock into current_stock
  from public.products
  where id = p_product_id
  for update;

  if current_stock is null then
    raise exception 'product not found';
  end if;

  if current_stock < p_quantity then
    raise exception 'insufficient stock';
  end if;

  new_stock := current_stock - p_quantity;

  update public.products
  set stock = new_stock
  where id = p_product_id;

  return new_stock;
end;
$$;

grant execute on function public.decrement_product_stock(bigint, integer) to anon;
grant execute on function public.decrement_product_stock(bigint, integer) to authenticated;