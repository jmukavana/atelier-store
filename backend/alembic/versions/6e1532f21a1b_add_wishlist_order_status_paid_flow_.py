"""add wishlist, order status paid flow, stripe session id

Revision ID: 6e1532f21a1b
Revises: 1b3757e4eef9
Create Date: 2026-09-27 11:07:56.520979

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6e1532f21a1b'
down_revision: Union[str, Sequence[str], None] = '1b3757e4eef9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('wishlist_items',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('product_id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id', 'product_id', name='uq_wishlist_user_product')
    )
    op.create_index(op.f('ix_wishlist_items_user_id'), 'wishlist_items', ['user_id'], unique=False)
    op.add_column('orders', sa.Column('stripe_session_id', sa.String(), nullable=True))
    op.create_unique_constraint('uq_orders_stripe_session_id', 'orders', ['stripe_session_id'])

    # order_status gained a real payment lifecycle (pending_payment -> paid)
    # and dropped the old single placeholder value. Autogenerate can't see
    # enum member changes, so this part is hand-written: swap the column to
    # text, remap old data, drop/recreate the type, swap back.
    op.execute("ALTER TABLE orders ALTER COLUMN status DROP DEFAULT")
    op.execute("ALTER TABLE orders ALTER COLUMN status TYPE text USING status::text")
    op.execute("UPDATE orders SET status = 'paid' WHERE status = 'demo_placed'")
    op.execute("DROP TYPE order_status")
    op.execute("CREATE TYPE order_status AS ENUM ('pending_payment', 'paid')")
    op.execute(
        "ALTER TABLE orders ALTER COLUMN status TYPE order_status USING status::order_status"
    )
    op.execute("ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pending_payment'")


def downgrade() -> None:
    op.execute("ALTER TABLE orders ALTER COLUMN status DROP DEFAULT")
    op.execute("ALTER TABLE orders ALTER COLUMN status TYPE text USING status::text")
    op.execute("UPDATE orders SET status = 'demo_placed' WHERE status IN ('pending_payment', 'paid')")
    op.execute("DROP TYPE order_status")
    op.execute("CREATE TYPE order_status AS ENUM ('demo_placed')")
    op.execute(
        "ALTER TABLE orders ALTER COLUMN status TYPE order_status USING status::order_status"
    )
    op.execute("ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'demo_placed'")

    op.drop_constraint('uq_orders_stripe_session_id', 'orders', type_='unique')
    op.drop_column('orders', 'stripe_session_id')
    op.drop_index(op.f('ix_wishlist_items_user_id'), table_name='wishlist_items')
    op.drop_table('wishlist_items')
